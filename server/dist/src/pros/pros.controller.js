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
exports.ProsController = void 0;
const common_1 = require("@nestjs/common");
const create_pro_badge_dto_1 = require("./dto/create-pro-badge.dto");
const create_pro_dto_1 = require("./dto/create-pro.dto");
const create_pro_extra_dto_1 = require("./dto/create-pro-extra.dto");
const create_pro_time_window_dto_1 = require("./dto/create-pro-time-window.dto");
const update_pro_badge_dto_1 = require("./dto/update-pro-badge.dto");
const update_pro_dto_1 = require("./dto/update-pro.dto");
const update_pro_extra_dto_1 = require("./dto/update-pro-extra.dto");
const update_pro_time_window_dto_1 = require("./dto/update-pro-time-window.dto");
const pros_service_1 = require("./pros.service");
let ProsController = class ProsController {
    constructor(prosService) {
        this.prosService = prosService;
    }
    create(dto) {
        return this.prosService.create(dto);
    }
    findAll() {
        return this.prosService.findAll();
    }
    findOne(id) {
        return this.prosService.findOne(id);
    }
    update(id, dto) {
        return this.prosService.update(id, dto);
    }
    remove(id) {
        return this.prosService.remove(id);
    }
    createTimeWindow(proId, dto) {
        return this.prosService.addTimeWindow(proId, dto);
    }
    listTimeWindows(proId) {
        return this.prosService.listTimeWindows(proId);
    }
    updateTimeWindow(proId, timeWindowId, dto) {
        return this.prosService.updateTimeWindow(proId, timeWindowId, dto);
    }
    removeTimeWindow(proId, timeWindowId) {
        return this.prosService.removeTimeWindow(proId, timeWindowId);
    }
    createBadge(proId, dto) {
        return this.prosService.addBadge(proId, dto);
    }
    listBadges(proId) {
        return this.prosService.listBadges(proId);
    }
    updateBadge(proId, badgeId, dto) {
        return this.prosService.updateBadge(proId, badgeId, dto);
    }
    removeBadge(proId, badgeId) {
        return this.prosService.removeBadge(proId, badgeId);
    }
    createExtra(proId, dto) {
        return this.prosService.addExtra(proId, dto);
    }
    listExtras(proId) {
        return this.prosService.listExtras(proId);
    }
    updateExtra(proId, extraId, dto) {
        return this.prosService.updateExtra(proId, extraId, dto);
    }
    removeExtra(proId, extraId) {
        return this.prosService.removeExtra(proId, extraId);
    }
};
exports.ProsController = ProsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_pro_dto_1.CreateProDto]),
    __metadata("design:returntype", void 0)
], ProsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ProsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_pro_dto_1.UpdateProDto]),
    __metadata("design:returntype", void 0)
], ProsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ProsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':proId/time-windows'),
    __param(0, (0, common_1.Param)('proId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_pro_time_window_dto_1.CreateProTimeWindowDto]),
    __metadata("design:returntype", void 0)
], ProsController.prototype, "createTimeWindow", null);
__decorate([
    (0, common_1.Get)(':proId/time-windows'),
    __param(0, (0, common_1.Param)('proId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ProsController.prototype, "listTimeWindows", null);
__decorate([
    (0, common_1.Patch)(':proId/time-windows/:timeWindowId'),
    __param(0, (0, common_1.Param)('proId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('timeWindowId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, update_pro_time_window_dto_1.UpdateProTimeWindowDto]),
    __metadata("design:returntype", void 0)
], ProsController.prototype, "updateTimeWindow", null);
__decorate([
    (0, common_1.Delete)(':proId/time-windows/:timeWindowId'),
    __param(0, (0, common_1.Param)('proId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('timeWindowId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], ProsController.prototype, "removeTimeWindow", null);
__decorate([
    (0, common_1.Post)(':proId/badges'),
    __param(0, (0, common_1.Param)('proId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_pro_badge_dto_1.CreateProBadgeDto]),
    __metadata("design:returntype", void 0)
], ProsController.prototype, "createBadge", null);
__decorate([
    (0, common_1.Get)(':proId/badges'),
    __param(0, (0, common_1.Param)('proId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ProsController.prototype, "listBadges", null);
__decorate([
    (0, common_1.Patch)(':proId/badges/:badgeId'),
    __param(0, (0, common_1.Param)('proId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('badgeId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, update_pro_badge_dto_1.UpdateProBadgeDto]),
    __metadata("design:returntype", void 0)
], ProsController.prototype, "updateBadge", null);
__decorate([
    (0, common_1.Delete)(':proId/badges/:badgeId'),
    __param(0, (0, common_1.Param)('proId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('badgeId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], ProsController.prototype, "removeBadge", null);
__decorate([
    (0, common_1.Post)(':proId/extras'),
    __param(0, (0, common_1.Param)('proId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_pro_extra_dto_1.CreateProExtraDto]),
    __metadata("design:returntype", void 0)
], ProsController.prototype, "createExtra", null);
__decorate([
    (0, common_1.Get)(':proId/extras'),
    __param(0, (0, common_1.Param)('proId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ProsController.prototype, "listExtras", null);
__decorate([
    (0, common_1.Patch)(':proId/extras/:extraId'),
    __param(0, (0, common_1.Param)('proId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('extraId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, update_pro_extra_dto_1.UpdateProExtraDto]),
    __metadata("design:returntype", void 0)
], ProsController.prototype, "updateExtra", null);
__decorate([
    (0, common_1.Delete)(':proId/extras/:extraId'),
    __param(0, (0, common_1.Param)('proId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('extraId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], ProsController.prototype, "removeExtra", null);
exports.ProsController = ProsController = __decorate([
    (0, common_1.Controller)('pros'),
    __metadata("design:paramtypes", [pros_service_1.ProsService])
], ProsController);
//# sourceMappingURL=pros.controller.js.map