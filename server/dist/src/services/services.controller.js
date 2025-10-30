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
exports.ServicesController = void 0;
const common_1 = require("@nestjs/common");
const create_service_dto_1 = require("./dto/create-service.dto");
const create_service_extra_dto_1 = require("./dto/create-service-extra.dto");
const update_service_dto_1 = require("./dto/update-service.dto");
const update_service_extra_dto_1 = require("./dto/update-service-extra.dto");
const services_service_1 = require("./services.service");
let ServicesController = class ServicesController {
    constructor(servicesService) {
        this.servicesService = servicesService;
    }
    create(dto) {
        return this.servicesService.create(dto);
    }
    findAll() {
        return this.servicesService.findAll();
    }
    findOne(id) {
        return this.servicesService.findOne(id);
    }
    update(id, dto) {
        return this.servicesService.update(id, dto);
    }
    remove(id) {
        return this.servicesService.remove(id);
    }
    createExtra(serviceId, dto) {
        return this.servicesService.addExtra(serviceId, dto);
    }
    listExtras(serviceId) {
        return this.servicesService.listExtras(serviceId);
    }
    updateExtra(serviceId, extraId, dto) {
        return this.servicesService.updateExtra(serviceId, extraId, dto);
    }
    removeExtra(serviceId, extraId) {
        return this.servicesService.removeExtra(serviceId, extraId);
    }
};
exports.ServicesController = ServicesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_service_dto_1.CreateServiceDto]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_service_dto_1.UpdateServiceDto]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':serviceId/extras'),
    __param(0, (0, common_1.Param)('serviceId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_service_extra_dto_1.CreateServiceExtraDto]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "createExtra", null);
__decorate([
    (0, common_1.Get)(':serviceId/extras'),
    __param(0, (0, common_1.Param)('serviceId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "listExtras", null);
__decorate([
    (0, common_1.Patch)(':serviceId/extras/:extraId'),
    __param(0, (0, common_1.Param)('serviceId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('extraId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, update_service_extra_dto_1.UpdateServiceExtraDto]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "updateExtra", null);
__decorate([
    (0, common_1.Delete)(':serviceId/extras/:extraId'),
    __param(0, (0, common_1.Param)('serviceId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('extraId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "removeExtra", null);
exports.ServicesController = ServicesController = __decorate([
    (0, common_1.Controller)('services'),
    __metadata("design:paramtypes", [services_service_1.ServicesService])
], ServicesController);
//# sourceMappingURL=services.controller.js.map