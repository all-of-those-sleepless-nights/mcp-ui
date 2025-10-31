"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var McpService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs/promises");
const path = require("path");
const prisma_service_1 = require("../prisma/prisma.service");
const oauth_service_1 = require("../auth/oauth.service");
const google_1 = require("../auth/google");
const homeflow_1 = require("./homeflow");
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
};
const TOOL_NAME = 'set-black-screen-title';
const BLACK_WIDGET_TITLE = 'Show Black Screen';
let McpService = McpService_1 = class McpService {
    constructor(prismaService, oauthService) {
        this.prismaService = prismaService;
        this.oauthService = oauthService;
        this.logger = new common_1.Logger(McpService_1.name);
        this.sessions = new Map();
        this.currentTitle = 'Loading…';
        this.homeflowTools = [];
        this.homeflowToolNames = new Set();
        this.homeflowResources = [];
        this.homeflowResourceTemplates = [];
    }
    async onModuleInit() {
        await this.loadSdk();
        await this.loadTemplate();
        await this.registerHandlers();
    }
    async onModuleDestroy() {
        await Promise.allSettled([...this.sessions.values()].map((session) => session.transport.close()));
        this.sessions.clear();
    }
    async handleSse(_req, res, token, metadataUrl) {
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
        transport.onerror = (error) => {
            this.logger.error(`MCP transport error (${sessionId}): ${error.message}`, error.stack);
            this.sessions.delete(sessionId);
        };
        this.logger.debug(`MCP session established: ${sessionId} (subject: ${token.subject})`);
        try {
            await this.refreshGoogleAccount(this.sessions.get(sessionId));
        }
        catch (error) {
            this.logger.error(`[OAuth] Failed to prime Google account context for session ${sessionId}`, error);
        }
    }
    async handlePost(sessionId, req, res, token) {
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
            const challenge = this.oauthService.buildChallenge(session.metadataUrl, 'invalid_token', 'Token subject does not match session');
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
                const message = JSON.parse(rawBody);
                if (message &&
                    typeof message === 'object' &&
                    message['method'] === 'tools/call' &&
                    message['params'] &&
                    typeof message['params'] === 'object') {
                    const params = message['params'];
                    const toolName = typeof params.name === 'string' ? params.name : undefined;
                    if (toolName === 'google-account') {
                        try {
                            await this.refreshGoogleAccount(session);
                        }
                        catch (error) {
                            this.logger.error('[OAuth] Failed to refresh Google account profile', error);
                        }
                    }
                    const meta = params._meta && typeof params._meta === 'object' ? params._meta : {};
                    message['params'] = {
                        ...params,
                        _meta: { ...meta, sessionId },
                    };
                }
                await session.transport.handleMessage(message);
                if (!res.headersSent) {
                    res.status(202).send('Accepted');
                }
                return;
            }
            catch (error) {
                this.logger.error(`Failed to process MCP message for session ${sessionId}`, error);
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
        }
        catch (error) {
            this.logger.error(`Failed to handle MCP POST for session ${sessionId}`, error.stack);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to handle MCP message' });
            }
        }
    }
    extractBodyFromRequest(req) {
        const body = req.body;
        if (typeof body === 'string') {
            return body;
        }
        if (Buffer.isBuffer(body)) {
            return body.toString('utf8');
        }
        if (body && typeof body === 'object') {
            try {
                return JSON.stringify(body);
            }
            catch {
                return undefined;
            }
        }
        return undefined;
    }
    handleOptions(res) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'content-type, authorization');
        res.status(204).send();
    }
    async loadSdk() {
        const dynamicImport = new Function('specifier', 'return import(specifier);');
        const [{ Server }, { SSEServerTransport }, types] = await Promise.all([
            dynamicImport('@modelcontextprotocol/sdk/server/index.js'),
            dynamicImport('@modelcontextprotocol/sdk/server/sse.js'),
            dynamicImport('@modelcontextprotocol/sdk/types.js'),
        ]);
        this.ServerCtor = Server;
        this.SseCtor = SSEServerTransport;
        this.typesModule = types;
        this.server = new Server({ name: 'ui-mcp-server', version: '0.1.0' }, { capabilities: { tools: {}, resources: {} } });
        this.homeflowAdapter = new homeflow_1.HomeflowMcpAdapter(this.prismaService.prisma);
    }
    async loadTemplate() {
        const candidates = [
            path.resolve(process.cwd(), '..', 'client', 'dist', BLACK_TEMPLATE_FILENAME),
            path.resolve(process.cwd(), 'client', 'dist', BLACK_TEMPLATE_FILENAME),
            path.resolve(__dirname, '..', '..', '..', 'client', 'dist', BLACK_TEMPLATE_FILENAME),
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
            }
            catch (error) {
                this.logger.debug(`MCP template not found at ${candidate}: ${error.message}`);
            }
        }
        this.logger.warn('Unable to locate MCP widget template. Run `npm run build` inside the client project to generate assets.');
        this.blackTemplate = undefined;
        this.blackScript = undefined;
    }
    async registerHandlers() {
        const server = this.ensureServer();
        const types = this.ensureTypesModule();
        await this.refreshHomeflowMetadata();
        server.setRequestHandler(types.ListToolsRequestSchema, async (_req) => {
            this.logger.debug('[MCP] list_tools');
            return { tools: [this.describeTool(), ...this.homeflowTools] };
        });
        server.setRequestHandler(types.ListResourcesRequestSchema, async (_req) => {
            this.logger.debug('[MCP] list_resources');
            return {
                resources: [this.describeResource(), ...this.homeflowResources],
            };
        });
        server.setRequestHandler(types.ListResourceTemplatesRequestSchema, async (_req) => {
            this.logger.debug('[MCP] list_resource_templates');
            return {
                resourceTemplates: [
                    this.describeResourceTemplate(),
                    ...this.homeflowResourceTemplates,
                ],
            };
        });
        server.setRequestHandler(types.ReadResourceRequestSchema, async (req) => {
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
            if (uri && uri.startsWith(homeflow_1.HOMEFLOW_TEMPLATE_URI)) {
                const adapter = this.homeflowAdapter;
                if (!adapter) {
                    throw new Error('HomeFlow adapter not ready');
                }
                const { html, config } = await adapter.readResource();
                const meta = { ...homeflow_1.HOMEFLOW_WIDGET_META, widgetData: config };
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
        });
        server.setRequestHandler(types.CallToolRequestSchema, async (req) => {
            const toolName = req.params.name;
            try {
                this.logger.debug(`[MCP] call_tool: ${toolName} args=${JSON.stringify(req.params.arguments)}`);
            }
            catch {
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
        });
    }
    describeTool() {
        return {
            name: TOOL_NAME,
            title: BLACK_WIDGET_TITLE,
            description: 'Render a black screen in the MCP widget with a custom title.',
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
    describeResource() {
        return {
            uri: BLACK_TEMPLATE_URI,
            name: 'Black screen widget',
            description: 'HTML template for the black screen widget.',
            mimeType: 'text/html+skybridge',
            _meta: BLACK_WIDGET_META,
        };
    }
    describeResourceTemplate() {
        return {
            uriTemplate: BLACK_TEMPLATE_URI,
            name: 'Black screen widget template',
            description: 'Black screen widget HTML template',
            mimeType: 'text/html+skybridge',
            _meta: BLACK_WIDGET_META,
        };
    }
    extractTitle(rawArgs) {
        if (!rawArgs || typeof rawArgs !== 'object') {
            throw new Error('Missing arguments');
        }
        const args = rawArgs;
        const title = typeof args.title === 'string' ? args.title.trim() : '';
        if (!title) {
            throw new Error('Title must be a non-empty string');
        }
        return title.slice(0, 120);
    }
    async renderBlackHtml(config) {
        if (!this.blackTemplate) {
            await this.loadTemplate();
        }
        const template = this.blackTemplate;
        const script = this.blackScript;
        if (!template || !script) {
            throw new Error('Black screen template not found. Run `npm run build` in the client project.');
        }
        const rawJson = JSON.stringify(config).replace(/</g, '\\u003c');
        const attrJson = rawJson.replace(/"/g, '&quot;');
        const safeScript = script.replace(/<\/script/gi, '<\\/script');
        return template
            .replace(BLACK_PLACEHOLDER, attrJson)
            .replace(BLACK_SCRIPT_PLACEHOLDER, safeScript);
    }
    async buildToolResponse(title) {
        const meta = { ...BLACK_WIDGET_META, widgetData: { title } };
        const summary = `Set black screen title to "${title}".`;
        const html = await this.renderBlackHtml({ title });
        const buildResourceContent = () => ({
            type: 'resource',
            resource: {
                uri: BLACK_TEMPLATE_URI,
                mimeType: 'text/html+skybridge',
                text: html,
                _meta: meta,
            },
        });
        const buildTextContent = () => ({ type: 'text', text: summary });
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
    async refreshGoogleAccount(session) {
        const token = session.token;
        const baseAccount = {
            subject: token.subject,
            name: typeof token.claims['name'] === 'string' ? token.claims['name'] : undefined,
            email: typeof token.claims.email === 'string' ? token.claims.email : undefined,
            picture: typeof token.claims['picture'] === 'string'
                ? token.claims['picture']
                : undefined,
        };
        this.homeflowAdapter?.setAccountContext(baseAccount);
        this.logger.debug(`[Homeflow] Account context updated from token for ${baseAccount.email ?? baseAccount.subject}`);
        try {
            const response = await fetch(google_1.GOOGLE_USERINFO_ENDPOINT, {
                headers: {
                    Authorization: `Bearer ${token.token}`,
                    Accept: 'application/json',
                },
            });
            if (!response.ok) {
                this.logger.warn(`[OAuth] Google userinfo returned ${response.status} for subject ${token.subject}`);
                return;
            }
            const payload = (await response.json());
            const account = {
                subject: token.subject,
                name: typeof payload.name === 'string' && payload.name.trim().length > 0
                    ? payload.name
                    : baseAccount.name,
                email: typeof payload.email === 'string' && payload.email.trim().length > 0
                    ? payload.email
                    : baseAccount.email,
                picture: typeof payload.picture === 'string' && payload.picture.trim().length > 0
                    ? payload.picture
                    : baseAccount.picture,
            };
            this.homeflowAdapter?.setAccountContext(account);
            this.logger.debug(`[Homeflow] Account context refreshed from Google userinfo for ${account.email ?? account.subject}`);
        }
        catch (error) {
            this.logger.error(`[OAuth] Failed to fetch Google user info for subject ${session.subject}`, error);
        }
    }
    async refreshHomeflowMetadata() {
        if (!this.homeflowAdapter)
            return;
        this.homeflowTools = await this.homeflowAdapter.listTools();
        this.homeflowToolNames = new Set(this.homeflowTools.map((tool) => tool.name));
        this.homeflowResources = await this.homeflowAdapter.listResources();
        this.homeflowResourceTemplates =
            await this.homeflowAdapter.listResourceTemplates();
    }
    ensureServer() {
        if (!this.server) {
            throw new Error('MCP server not initialized');
        }
        return this.server;
    }
    ensureSseCtor() {
        if (!this.SseCtor) {
            throw new Error('MCP SSE transport not initialized');
        }
        return this.SseCtor;
    }
    ensureTypesModule() {
        if (!this.typesModule) {
            throw new Error('MCP types module not initialized');
        }
        return this.typesModule;
    }
};
exports.McpService = McpService;
exports.McpService = McpService = McpService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        oauth_service_1.OauthService])
], McpService);
//# sourceMappingURL=mcp.service.js.map