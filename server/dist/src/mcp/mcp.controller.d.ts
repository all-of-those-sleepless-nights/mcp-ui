import { Request, Response } from 'express';
import { McpService } from './mcp.service';
import { OauthService } from '../auth/oauth.service';
import type { Request as RawRequest } from 'express';
export declare class McpController {
    private readonly mcpService;
    private readonly oauthService;
    constructor(mcpService: McpService, oauthService: OauthService);
    handleRootOptions(res: Response): void;
    handleMessagesOptions(res: Response): void;
    openStream(req: RawRequest, res: Response): Promise<void>;
    receiveMessage(sessionId: string | undefined, req: Request, res: Response): Promise<void>;
}
