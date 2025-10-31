import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';

import { PrismaService } from '../prisma/prisma.service';
import { OauthService } from '../auth/oauth.service';
import {
  type VerifiedGoogleAccessToken,
  GOOGLE_USERINFO_ENDPOINT,
} from '../auth/google';
import {
  HomeflowMcpAdapter,
  HOMEFLOW_WIDGET_META,
  HOMEFLOW_TEMPLATE_URI,
} from './homeflow';

type McpServerConstructor =
  typeof import('@modelcontextprotocol/sdk/server/index.js').Server;
type McpServerInstance = InstanceType<McpServerConstructor>;
type McpSseConstructor =
  typeof import('@modelcontextprotocol/sdk/server/sse.js').SSEServerTransport;
type McpSseInstance = InstanceType<McpSseConstructor>;
type McpTypesModule = typeof import('@modelcontextprotocol/sdk/types.js');

type Tool = import('@modelcontextprotocol/sdk/types.js').Tool;
type Resource = import('@modelcontextprotocol/sdk/types.js').Resource;
type ResourceTemplate =
  import('@modelcontextprotocol/sdk/types.js').ResourceTemplate;
type CallToolResult =
  import('@modelcontextprotocol/sdk/types.js').CallToolResult;
type CallToolRequest =
  import('@modelcontextprotocol/sdk/types.js').CallToolRequest;
type ListToolsRequest =
  import('@modelcontextprotocol/sdk/types.js').ListToolsRequest;
type ListResourcesRequest =
  import('@modelcontextprotocol/sdk/types.js').ListResourcesRequest;
type ListResourceTemplatesRequest =
  import('@modelcontextprotocol/sdk/types.js').ListResourceTemplatesRequest;
type ReadResourceRequest =
  import('@modelcontextprotocol/sdk/types.js').ReadResourceRequest;

type BlackWidgetConfig = {
  title: string;
};

type SessionEntry = {
  transport: McpSseInstance;
  subject: string;
  metadataUrl: string;
  token: VerifiedGoogleAccessToken;
};

const BLACK_WIDGET_ID = 'black-screen';
const BLACK_TEMPLATE_URI = 'ui://widget/black.html';
const BLACK_TEMPLATE_FILENAME = 'black.html';
const BLACK_PLACEHOLDER = '__BLACK_CONFIG_JSON__';
const BLACK_SCRIPT_PLACEHOLDER = '__BLACK_SCRIPT_MODULE__';
const BLACK_WIDGET_META = {
  'openai/outputTemplate': BLACK_TEMPLATE_URI,
  'openai/widgetAccessible': true,
  'openai/resultCanProduceWidget': true,
  'openai/toolInvocation/invoking': 'Preparing the black screen…',
  'openai/toolInvocation/invoked': 'Black screen ready!',
} as const;

const TOOL_NAME = 'set-black-screen-title';
const BLACK_WIDGET_TITLE = 'Show Black Screen';

@Injectable()
export class McpService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(McpService.name);
  private ServerCtor?: McpServerConstructor;
  private SseCtor?: McpSseConstructor;
  private typesModule?: McpTypesModule;

  private server?: McpServerInstance;
  private readonly sessions = new Map<string, SessionEntry>();
  private blackTemplate?: string;
  private blackScript?: string;
  private currentTitle = 'Loading…';
  private homeflowAdapter?: HomeflowMcpAdapter;
  private homeflowTools: Tool[] = [];
  private homeflowToolNames = new Set<string>();
  private homeflowResources: Resource[] = [];
  private homeflowResourceTemplates: ResourceTemplate[] = [];

  constructor(
    private readonly prismaService: PrismaService,
    private readonly oauthService: OauthService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.loadSdk();
    await this.loadTemplate();
    await this.registerHandlers();
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.allSettled(
      [...this.sessions.values()].map((session) => session.transport.close()),
    );
    this.sessions.clear();
  }

  async handleSse(
    _req: Request,
    res: Response,
    token: VerifiedGoogleAccessToken,
    metadataUrl: string,
  ): Promise<void> {
    const server = this.ensureServer();
    const SseCtor = this.ensureSseCtor();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', 'text/event-stream');

    const transport = new SseCtor('/mcp/messages', res);
    await server.connect(transport);

    const sessionId = transport.sessionId;
    this.sessions.set(sessionId, {
      transport,
      subject: token.subject,
      metadataUrl,
      token,
    });

    transport.onclose = () => {
      this.sessions.delete(sessionId);
    };
    transport.onerror = (error: Error) => {
      this.logger.error(
        `MCP transport error (${sessionId}): ${error.message}`,
        error.stack,
      );
      this.sessions.delete(sessionId);
    };

    this.logger.debug(
      `MCP session established: ${sessionId} (subject: ${token.subject})`,
    );

    try {
      await this.refreshGoogleAccount(this.sessions.get(sessionId)!);
    } catch (error) {
      this.logger.error(
        `[OAuth] Failed to prime Google account context for session ${sessionId}`,
        error as Error,
      );
    }
  }

  async handlePost(
    sessionId: string | undefined,
    req: Request,
    res: Response,
    token: VerifiedGoogleAccessToken,
  ): Promise<void> {
    if (!sessionId) {
      res.status(400).json({ error: 'Missing sessionId query parameter' });
      return;
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      res.status(404).json({ error: `Unknown session ${sessionId}` });
      return;
    }

    res.setHeader('Access-Control-Allow-Origin', '*');

    if (session.subject !== token.subject) {
      const challenge = this.oauthService.buildChallenge(
        session.metadataUrl,
        'invalid_token',
        'Token subject does not match session',
      );
      res.setHeader('WWW-Authenticate', challenge);
      res
        .status(401)
        .json({ error: 'invalid_token', error_description: 'Token subject does not match session' });
      return;
    }

    session.subject = token.subject;
    session.token = token;

    const rawBody = this.extractBodyFromRequest(req);
    if (rawBody) {
      try {
        const message = JSON.parse(rawBody) as Record<string, unknown>;
        if (
          message &&
          typeof message === 'object' &&
          message['method'] === 'tools/call' &&
          message['params'] &&
          typeof message['params'] === 'object'
        ) {
          const params = message['params'] as Record<string, unknown>;
          const toolName = typeof params.name === 'string' ? params.name : undefined;
          if (toolName === 'google-account') {
            try {
              await this.refreshGoogleAccount(session);
            } catch (error) {
              this.logger.error(
                '[OAuth] Failed to refresh Google account profile',
                error as Error,
              );
            }
          }
          const meta = params._meta && typeof params._meta === 'object' ? params._meta : {};
          message['params'] = {
            ...params,
            _meta: { ...(meta as Record<string, unknown>), sessionId },
          };
        }
        await session.transport.handleMessage(message);
        if (!res.headersSent) {
          res.status(202).send('Accepted');
        }
        return;
      } catch (error) {
        this.logger.error(
          `Failed to process MCP message for session ${sessionId}`,
          error as Error,
        );
        if (!res.headersSent) {
          res
            .status(400)
            .json({ error: 'invalid_request', error_description: 'Invalid MCP payload' });
        }
        return;
      }
    }

    try {
      await session.transport.handlePostMessage(req, res);
    } catch (error) {
      this.logger.error(
        `Failed to handle MCP POST for session ${sessionId}`,
        (error as Error).stack,
      );
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to handle MCP message' });
      }
    }
  }

  private extractBodyFromRequest(req: Request): string | undefined {
    const body = (req as Request & { body?: unknown }).body;
    if (typeof body === 'string') {
      return body;
    }
    if (Buffer.isBuffer(body)) {
      return body.toString('utf8');
    }
    if (body && typeof body === 'object') {
      try {
        return JSON.stringify(body);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  handleOptions(res: Response): void {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'content-type, authorization');
    res.status(204).send();
  }

  private async loadSdk(): Promise<void> {
    const dynamicImport = new Function(
      'specifier',
      'return import(specifier);',
    ) as <T>(specifier: string) => Promise<T>;

    const [{ Server }, { SSEServerTransport }, types] = await Promise.all([
      dynamicImport<typeof import('@modelcontextprotocol/sdk/server/index.js')>(
        '@modelcontextprotocol/sdk/server/index.js',
      ),
      dynamicImport<typeof import('@modelcontextprotocol/sdk/server/sse.js')>(
        '@modelcontextprotocol/sdk/server/sse.js',
      ),
      dynamicImport<typeof import('@modelcontextprotocol/sdk/types.js')>(
        '@modelcontextprotocol/sdk/types.js',
      ),
    ]);

    this.ServerCtor = Server;
    this.SseCtor = SSEServerTransport;
    this.typesModule = types;

    this.server = new Server(
      { name: 'ui-mcp-server', version: '0.1.0' },
      { capabilities: { tools: {}, resources: {} } },
    );

    this.homeflowAdapter = new HomeflowMcpAdapter(this.prismaService.prisma);
  }

  private async loadTemplate(): Promise<void> {
    const candidates = [
      path.resolve(
        process.cwd(),
        '..',
        'client',
        'dist',
        BLACK_TEMPLATE_FILENAME,
      ),
      path.resolve(process.cwd(), 'client', 'dist', BLACK_TEMPLATE_FILENAME),
      path.resolve(
        __dirname,
        '..',
        '..',
        '..',
        'client',
        'dist',
        BLACK_TEMPLATE_FILENAME,
      ),
    ];

    for (const candidate of candidates) {
      try {
        const html = await fs.readFile(candidate, 'utf8');
        const scriptCandidate = candidate.replace(/\.html?$/, '.js');
        const script = await fs.readFile(scriptCandidate, 'utf8');
        this.blackTemplate = html;
        this.blackScript = script;
        this.logger.log(`Loaded MCP widget template from ${candidate}`);
        return;
      } catch (error) {
        this.logger.debug(
          `MCP template not found at ${candidate}: ${(error as Error).message}`,
        );
      }
    }

    this.logger.warn(
      'Unable to locate MCP widget template. Run `npm run build` inside the client project to generate assets.',
    );
    this.blackTemplate = undefined;
    this.blackScript = undefined;
  }

  private async registerHandlers(): Promise<void> {
    const server = this.ensureServer();
    const types = this.ensureTypesModule();
    await this.refreshHomeflowMetadata();

    server.setRequestHandler(
      types.ListToolsRequestSchema,
      async (_req: ListToolsRequest) => {
        this.logger.debug('[MCP] list_tools');
        return { tools: [this.describeTool(), ...this.homeflowTools] };
      },
    );

    server.setRequestHandler(
      types.ListResourcesRequestSchema,
      async (_req: ListResourcesRequest) => {
        this.logger.debug('[MCP] list_resources');
        return {
          resources: [this.describeResource(), ...this.homeflowResources],
        };
      },
    );

    server.setRequestHandler(
      types.ListResourceTemplatesRequestSchema,
      async (_req: ListResourceTemplatesRequest) => {
        this.logger.debug('[MCP] list_resource_templates');
        return {
          resourceTemplates: [
            this.describeResourceTemplate(),
            ...this.homeflowResourceTemplates,
          ],
        };
      },
    );

    server.setRequestHandler(
      types.ReadResourceRequestSchema,
      async (req: ReadResourceRequest) => {
        this.logger.debug(`[MCP] read_resource: ${req.params.uri}`);
        const uri = req.params.uri;
        if (uri && uri.startsWith(BLACK_TEMPLATE_URI)) {
          const html = await this.renderBlackHtml({ title: this.currentTitle });
          const meta = {
            ...BLACK_WIDGET_META,
            widgetData: { title: this.currentTitle },
          };
          return {
            contents: [
              {
                uri,
                mimeType: 'text/html+skybridge',
                text: html,
                _meta: meta,
              },
            ],
          };
        }
        if (uri && uri.startsWith(HOMEFLOW_TEMPLATE_URI)) {
          const adapter = this.homeflowAdapter;
          if (!adapter) {
            throw new Error('HomeFlow adapter not ready');
          }
          const { html, config } = await adapter.readResource();
          const meta = { ...HOMEFLOW_WIDGET_META, widgetData: config };
          return {
            contents: [
              {
                uri,
                mimeType: 'text/html+skybridge',
                text: html,
                _meta: meta,
              },
            ],
          };
        }
        throw new Error(`Unknown resource: ${uri}`);
      },
    );

    server.setRequestHandler(
      types.CallToolRequestSchema,
      async (req: CallToolRequest) => {
        const toolName = req.params.name;
        try {
          this.logger.debug(
            `[MCP] call_tool: ${toolName} args=${JSON.stringify(req.params.arguments)}`,
          );
        } catch {
          this.logger.debug(`[MCP] call_tool: ${toolName} (arguments not serializable)`);
        }
        if (toolName === TOOL_NAME) {
          const title = this.extractTitle(req.params.arguments);
          this.currentTitle = title;
          return this.buildToolResponse(title);
        }

        if (this.homeflowToolNames.has(toolName)) {
          const adapter = this.homeflowAdapter;
          if (!adapter) {
            throw new Error('HomeFlow adapter not ready');
          }
          return adapter.handleTool(toolName, req.params.arguments);
        }
        throw new Error(`Unknown tool: ${toolName}`);
      },
    );
  }

  private describeTool(): Tool {
    return {
      name: TOOL_NAME,
      title: BLACK_WIDGET_TITLE,
      description:
        'Render a black screen in the MCP widget with a custom title.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: {
            type: 'string',
            description: 'Title text to display in the black screen widget.',
          },
        },
        required: ['title'],
      },
      _meta: BLACK_WIDGET_META,
    };
  }

  private describeResource(): Resource {
    return {
      uri: BLACK_TEMPLATE_URI,
      name: 'Black screen widget',
      description: 'HTML template for the black screen widget.',
      mimeType: 'text/html+skybridge',
      _meta: BLACK_WIDGET_META,
    };
  }

  private describeResourceTemplate(): ResourceTemplate {
    return {
      uriTemplate: BLACK_TEMPLATE_URI,
      name: 'Black screen widget template',
      description: 'Black screen widget HTML template',
      mimeType: 'text/html+skybridge',
      _meta: BLACK_WIDGET_META,
    };
  }

  private extractTitle(rawArgs: unknown): string {
    if (!rawArgs || typeof rawArgs !== 'object') {
      throw new Error('Missing arguments');
    }
    const args = rawArgs as Record<string, unknown>;
    const title = typeof args.title === 'string' ? args.title.trim() : '';
    if (!title) {
      throw new Error('Title must be a non-empty string');
    }
    return title.slice(0, 120);
  }

  private async renderBlackHtml(config: BlackWidgetConfig): Promise<string> {
    if (!this.blackTemplate) {
      await this.loadTemplate();
    }

    const template = this.blackTemplate;
    const script = this.blackScript;
    if (!template || !script) {
      throw new Error(
        'Black screen template not found. Run `npm run build` in the client project.',
      );
    }

    const rawJson = JSON.stringify(config).replace(/</g, '\\u003c');
    const attrJson = rawJson.replace(/"/g, '&quot;');
    const safeScript = script.replace(/<\/script/gi, '<\\/script');

    return template
      .replace(BLACK_PLACEHOLDER, attrJson)
      .replace(BLACK_SCRIPT_PLACEHOLDER, safeScript);
  }

  private async buildToolResponse(title: string): Promise<CallToolResult> {
    const meta = { ...BLACK_WIDGET_META, widgetData: { title } };
    const summary = `Set black screen title to "${title}".`;
    const html = await this.renderBlackHtml({ title });

    const buildResourceContent = () => ({
      type: 'resource' as const,
      resource: {
        uri: BLACK_TEMPLATE_URI,
        mimeType: 'text/html+skybridge',
        text: html,
        _meta: meta,
      },
    });

    const buildTextContent = () => ({ type: 'text' as const, text: summary });

    return {
      content: [buildResourceContent(), buildTextContent()],
      structuredContent: { widgetData: { title } },
      _meta: meta,
      toolResult: {
        content: [buildResourceContent(), buildTextContent()],
        structuredContent: { widgetData: { title } },
        _meta: meta,
      },
    };
  }

  private async refreshGoogleAccount(session: SessionEntry): Promise<void> {
    const token = session.token;
    const baseAccount = {
      subject: token.subject,
      name: typeof token.claims['name'] === 'string' ? (token.claims['name'] as string) : undefined,
      email: typeof token.claims.email === 'string' ? (token.claims.email as string) : undefined,
      picture:
        typeof token.claims['picture'] === 'string'
          ? (token.claims['picture'] as string)
          : undefined,
    };
    this.homeflowAdapter?.setAccountContext(baseAccount);
    this.logger.debug(
      `[Homeflow] Account context updated from token for ${baseAccount.email ?? baseAccount.subject}`,
    );
    try {
      const response = await fetch(GOOGLE_USERINFO_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${token.token}`,
          Accept: 'application/json',
        },
      });
      if (!response.ok) {
        this.logger.warn(
          `[OAuth] Google userinfo returned ${response.status} for subject ${token.subject}`,
        );
        return;
      }
      const payload = (await response.json()) as Record<string, unknown>;
      const account = {
        subject: token.subject,
        name:
          typeof payload.name === 'string' && payload.name.trim().length > 0
            ? payload.name
            : baseAccount.name,
        email:
          typeof payload.email === 'string' && payload.email.trim().length > 0
            ? payload.email
            : baseAccount.email,
        picture:
          typeof payload.picture === 'string' && payload.picture.trim().length > 0
            ? payload.picture
            : baseAccount.picture,
      };
      this.homeflowAdapter?.setAccountContext(account);
      this.logger.debug(
        `[Homeflow] Account context refreshed from Google userinfo for ${account.email ?? account.subject}`,
      );
    } catch (error) {
      this.logger.error(
        `[OAuth] Failed to fetch Google user info for subject ${session.subject}`,
        error as Error,
      );
    }
  }

  private async refreshHomeflowMetadata(): Promise<void> {
    if (!this.homeflowAdapter) return;
    this.homeflowTools = await this.homeflowAdapter.listTools();
    this.homeflowToolNames = new Set(
      this.homeflowTools.map((tool) => tool.name),
    );
    this.homeflowResources = await this.homeflowAdapter.listResources();
    this.homeflowResourceTemplates =
      await this.homeflowAdapter.listResourceTemplates();
  }

  private ensureServer(): McpServerInstance {
    if (!this.server) {
      throw new Error('MCP server not initialized');
    }
    return this.server;
  }

  private ensureSseCtor(): McpSseConstructor {
    if (!this.SseCtor) {
      throw new Error('MCP SSE transport not initialized');
    }
    return this.SseCtor;
  }

  private ensureTypesModule(): McpTypesModule {
    if (!this.typesModule) {
      throw new Error('MCP types module not initialized');
    }
    return this.typesModule;
  }
}
