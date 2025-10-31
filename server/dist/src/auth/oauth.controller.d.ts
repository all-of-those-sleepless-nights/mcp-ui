import type { Request, Response } from 'express';
import { OauthService } from './oauth.service';
export declare class OauthController {
    private readonly oauthService;
    constructor(oauthService: OauthService);
    getProtectedResourceMetadata(req: Request, res: Response): void;
    getOpenIdConfiguration(req: Request, res: Response): void;
    handleOptions(res: Response): void;
    register(body: unknown, res: Response): void;
}
