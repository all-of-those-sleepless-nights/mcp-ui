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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OauthController = void 0;
const common_1 = require("@nestjs/common");
const oauth_service_1 = require("./oauth.service");
let OauthController = class OauthController {
    constructor(oauthService) {
        this.oauthService = oauthService;
    }
    getProtectedResourceMetadata(req, res) {
        this.oauthService.respondProtectedResource(req, res);
    }
    getOpenIdConfiguration(req, res) {
        this.oauthService.respondOpenIdConfiguration(req, res);
    }
    handleOptions(res) {
        this.oauthService.setCorsHeaders(res);
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization');
        res.status(204).send();
    }
    register(body, res) {
        this.oauthService.handleDynamicRegistration(body, res);
    }
};
exports.OauthController = OauthController;
__decorate([
    (0, common_1.Get)(oauth_service_1.PROTECTED_RESOURCE_PATH),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], OauthController.prototype, "getProtectedResourceMetadata", null);
__decorate([
    (0, common_1.Get)(oauth_service_1.OPENID_CONFIGURATION_PATH),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], OauthController.prototype, "getOpenIdConfiguration", null);
__decorate([
    (0, common_1.Options)(oauth_service_1.OAUTH_REGISTRATION_PATH),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OauthController.prototype, "handleOptions", null);
__decorate([
    (0, common_1.Post)(oauth_service_1.OAUTH_REGISTRATION_PATH),
    (0, common_1.HttpCode)(201),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], OauthController.prototype, "register", null);
exports.OauthController = OauthController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [oauth_service_1.OauthService])
], OauthController);
//# sourceMappingURL=oauth.controller.js.map