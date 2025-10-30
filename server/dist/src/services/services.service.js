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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ServicesService = class ServicesService {
    constructor(prismaService) {
        this.prismaService = prismaService;
    }
    async create(dto) {
        return this.prismaService.prisma.service.create({
            data: {
                slug: dto.slug,
                title: dto.title,
                description: dto.description,
                defaultPriceLow: dto.defaultPriceLow,
                defaultPriceHigh: dto.defaultPriceHigh,
                defaultRadiusKm: dto.defaultRadiusKm,
                defaultWorkingDays: dto.defaultWorkingDays,
            },
            include: { extras: true },
        });
    }
    async findAll() {
        return this.prismaService.prisma.service.findMany({
            include: { extras: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const service = await this.prismaService.prisma.service.findUnique({
            where: { id },
            include: {
                extras: true,
                pros: {
                    include: {
                        timeWindows: true,
                        badges: true,
                        extras: true,
                    },
                },
                bookings: true,
            },
        });
        if (!service) {
            throw new common_1.NotFoundException(`Service ${id} not found`);
        }
        return service;
    }
    async update(id, dto) {
        await this.ensureExists(id);
        return this.prismaService.prisma.service.update({
            where: { id },
            data: {
                slug: dto.slug,
                title: dto.title,
                description: dto.description,
                defaultPriceLow: dto.defaultPriceLow,
                defaultPriceHigh: dto.defaultPriceHigh,
                defaultRadiusKm: dto.defaultRadiusKm,
                defaultWorkingDays: dto.defaultWorkingDays,
            },
            include: { extras: true },
        });
    }
    async remove(id) {
        await this.ensureExists(id);
        await this.prismaService.prisma.service.delete({
            where: { id },
        });
    }
    async addExtra(serviceId, dto) {
        await this.ensureExists(serviceId);
        return this.prismaService.prisma.serviceExtra.create({
            data: {
                serviceId,
                name: dto.name,
                price: dto.price,
            },
        });
    }
    async listExtras(serviceId) {
        await this.ensureExists(serviceId);
        return this.prismaService.prisma.serviceExtra.findMany({
            where: { serviceId },
            orderBy: { name: 'asc' },
        });
    }
    async updateExtra(serviceId, extraId, dto) {
        await this.ensureExtraBelongsToService(serviceId, extraId);
        return this.prismaService.prisma.serviceExtra.update({
            where: { id: extraId },
            data: {
                name: dto.name,
                price: dto.price,
            },
        });
    }
    async removeExtra(serviceId, extraId) {
        await this.ensureExtraBelongsToService(serviceId, extraId);
        await this.prismaService.prisma.serviceExtra.delete({
            where: { id: extraId },
        });
    }
    async ensureExists(id) {
        const exists = await this.prismaService.prisma.service.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!exists) {
            throw new common_1.NotFoundException(`Service ${id} not found`);
        }
    }
    async ensureExtraBelongsToService(serviceId, extraId) {
        const extra = await this.prismaService.prisma.serviceExtra.findUnique({
            where: { id: extraId },
            select: { id: true, serviceId: true },
        });
        if (!extra || extra.serviceId !== serviceId) {
            throw new common_1.NotFoundException(`Extra ${extraId} not found for service ${serviceId}`);
        }
    }
};
exports.ServicesService = ServicesService;
exports.ServicesService = ServicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ServicesService);
//# sourceMappingURL=services.service.js.map