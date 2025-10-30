"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var McpService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs/promises");
const path = require("path");
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
    constructor() {
        this.logger = new common_1.Logger(McpService_1.name);
        this.sessions = new Map();
        this.currentTitle = 'Loading…';
    }
    async onModuleInit() {
        await this.loadSdk();
        await this.loadTemplate();
        this.registerHandlers();
    }
    async onModuleDestroy() {
        await Promise.allSettled([...this.sessions.values()].map((session) => session.close()));
        this.sessions.clear();
    }
    async handleSse(_req, res) {
        const server = this.ensureServer();
        const SseCtor = this.ensureSseCtor();
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Content-Type', 'text/event-stream');
        const transport = new SseCtor('/mcp/messages', res);
        await server.connect(transport);
        const sessionId = transport.sessionId;
        this.sessions.set(sessionId, transport);
        transport.onclose = () => {
            this.sessions.delete(sessionId);
        };
        transport.onerror = (error) => {
            this.logger.error(`MCP transport error (${sessionId}): ${error.message}`, error.stack);
            this.sessions.delete(sessionId);
        };
        this.logger.debug(`MCP session established: ${sessionId}`);
    }
    async handlePost(sessionId, req, res) {
        if (!sessionId) {
            res.status(400).json({ error: 'Missing sessionId query parameter' });
            return;
        }
        const transport = this.sessions.get(sessionId);
        if (!transport) {
            res.status(404).json({ error: `Unknown session ${sessionId}` });
            return;
        }
        res.setHeader('Access-Control-Allow-Origin', '*');
        try {
            await transport.handlePostMessage(req, res);
            return;
        }
        catch (error) {
            const message = error?.message ?? '';
            if (/stream is not readable/i.test(message)) {
                try {
                    const rawBody = this.extractBodyFromRequest(req);
                    if (rawBody) {
                        await transport.handleMessage(JSON.parse(rawBody));
                        if (!res.headersSent) {
                            res.status(202).send('Accepted');
                        }
                        return;
                    }
                }
                catch (fallbackError) {
                    this.logger.error(`Failed to recover MCP POST for session ${sessionId}: ${fallbackError.message}`, fallbackError.stack);
                }
            }
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
    registerHandlers() {
        const server = this.ensureServer();
        const types = this.ensureTypesModule();
        server.setRequestHandler(types.ListToolsRequestSchema, async (_req) => {
            this.logger.debug('[MCP] list_tools');
            return { tools: [this.describeTool()] };
        });
        server.setRequestHandler(types.ListResourcesRequestSchema, async (_req) => {
            this.logger.debug('[MCP] list_resources');
            return { resources: [this.describeResource()] };
        });
        server.setRequestHandler(types.ListResourceTemplatesRequestSchema, async (_req) => {
            this.logger.debug('[MCP] list_resource_templates');
            return { resourceTemplates: [this.describeResourceTemplate()] };
        });
        server.setRequestHandler(types.ReadResourceRequestSchema, async (req) => {
            this.logger.debug(`[MCP] read_resource: ${req.params.uri}`);
            const uri = req.params.uri;
            if (!uri || !uri.startsWith(BLACK_TEMPLATE_URI)) {
                throw new Error(`Unknown resource: ${uri}`);
            }
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
        });
        server.setRequestHandler(types.CallToolRequestSchema, async (req) => {
            if (req.params.name !== TOOL_NAME) {
                throw new Error(`Unknown tool: ${req.params.name}`);
            }
            const title = this.extractTitle(req.params.arguments);
            this.currentTitle = title;
            return this.buildToolResponse(title);
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
    (0, common_1.Injectable)()
], McpService);
//# sourceMappingURL=mcp.service.js.map