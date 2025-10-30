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
exports.ProsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProsService = class ProsService {
    constructor(prismaService) {
        this.prismaService = prismaService;
    }
    async create(dto) {
        await this.ensureServiceExists(dto.serviceId);
        return this.prismaService.prisma.pro.create({
            data: {
                slug: dto.slug,
                serviceId: dto.serviceId,
                name: dto.name,
                image: dto.image,
                imageAlt: dto.imageAlt,
                rating: dto.rating,
                reviewsCount: dto.reviewsCount,
                priceFrom: dto.priceFrom,
                currency: dto.currency,
                latitude: dto.latitude,
                longitude: dto.longitude,
                serviceRadiusKm: dto.serviceRadiusKm,
                workingDays: dto.workingDays,
                baseQuoteLow: dto.baseQuoteLow,
                baseQuoteHigh: dto.baseQuoteHigh,
            },
            include: {
                timeWindows: true,
                badges: true,
                extras: true,
            },
        });
    }
    async findAll() {
        return this.prismaService.prisma.pro.findMany({
            include: {
                timeWindows: true,
                badges: true,
                extras: true,
                service: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const pro = await this.prismaService.prisma.pro.findUnique({
            where: { id },
            include: {
                timeWindows: true,
                badges: true,
                extras: true,
                service: true,
                bookings: true,
                reviews: true,
            },
        });
        if (!pro) {
            throw new common_1.NotFoundException(`Pro ${id} not found`);
        }
        return pro;
    }
    async update(id, dto) {
        const pro = await this.ensureProExists(id);
        if (dto.serviceId && dto.serviceId !== pro.serviceId) {
            await this.ensureServiceExists(dto.serviceId);
        }
        return this.prismaService.prisma.pro.update({
            where: { id },
            data: {
                slug: dto.slug,
                serviceId: dto.serviceId,
                name: dto.name,
                image: dto.image,
                imageAlt: dto.imageAlt,
                rating: dto.rating,
                reviewsCount: dto.reviewsCount,
                priceFrom: dto.priceFrom,
                currency: dto.currency,
                latitude: dto.latitude,
                longitude: dto.longitude,
                serviceRadiusKm: dto.serviceRadiusKm,
                workingDays: dto.workingDays,
                baseQuoteLow: dto.baseQuoteLow,
                baseQuoteHigh: dto.baseQuoteHigh,
            },
            include: {
                timeWindows: true,
                badges: true,
                extras: true,
            },
        });
    }
    async remove(id) {
        await this.ensureProExists(id);
        await this.prismaService.prisma.pro.delete({
            where: { id },
        });
    }
    async addTimeWindow(proId, dto) {
        await this.ensureProExists(proId);
        return this.prismaService.prisma.proTimeWindow.create({
            data: {
                proId,
                start: dto.start,
                end: dto.end,
            },
        });
    }
    async listTimeWindows(proId) {
        await this.ensureProExists(proId);
        return this.prismaService.prisma.proTimeWindow.findMany({
            where: { proId },
            orderBy: { start: 'asc' },
        });
    }
    async updateTimeWindow(proId, timeWindowId, dto) {
        await this.ensureTimeWindowBelongsToPro(proId, timeWindowId);
        return this.prismaService.prisma.proTimeWindow.update({
            where: { id: timeWindowId },
            data: {
                start: dto.start,
                end: dto.end,
            },
        });
    }
    async removeTimeWindow(proId, timeWindowId) {
        await this.ensureTimeWindowBelongsToPro(proId, timeWindowId);
        await this.prismaService.prisma.proTimeWindow.delete({
            where: { id: timeWindowId },
        });
    }
    async addBadge(proId, dto) {
        await this.ensureProExists(proId);
        return this.prismaService.prisma.proBadge.create({
            data: {
                proId,
                label: dto.label,
            },
        });
    }
    async listBadges(proId) {
        await this.ensureProExists(proId);
        return this.prismaService.prisma.proBadge.findMany({
            where: { proId },
            orderBy: { label: 'asc' },
        });
    }
    async updateBadge(proId, badgeId, dto) {
        await this.ensureBadgeBelongsToPro(proId, badgeId);
        return this.prismaService.prisma.proBadge.update({
            where: { id: badgeId },
            data: {
                label: dto.label,
            },
        });
    }
    async removeBadge(proId, badgeId) {
        await this.ensureBadgeBelongsToPro(proId, badgeId);
        await this.prismaService.prisma.proBadge.delete({
            where: { id: badgeId },
        });
    }
    async addExtra(proId, dto) {
        await this.ensureProExists(proId);
        return this.prismaService.prisma.proExtra.create({
            data: {
                proId,
                name: dto.name,
                price: dto.price,
            },
        });
    }
    async listExtras(proId) {
        await this.ensureProExists(proId);
        return this.prismaService.prisma.proExtra.findMany({
            where: { proId },
            orderBy: { name: 'asc' },
        });
    }
    async updateExtra(proId, extraId, dto) {
        await this.ensureExtraBelongsToPro(proId, extraId);
        return this.prismaService.prisma.proExtra.update({
            where: { id: extraId },
            data: {
                name: dto.name,
                price: dto.price,
            },
        });
    }
    async removeExtra(proId, extraId) {
        await this.ensureExtraBelongsToPro(proId, extraId);
        await this.prismaService.prisma.proExtra.delete({
            where: { id: extraId },
        });
    }
    async ensureServiceExists(serviceId) {
        const service = await this.prismaService.prisma.service.findUnique({
            where: { id: serviceId },
            select: { id: true },
        });
        if (!service) {
            throw new common_1.NotFoundException(`Service ${serviceId} not found`);
        }
    }
    async ensureProExists(id) {
        const pro = await this.prismaService.prisma.pro.findUnique({
            where: { id },
        });
        if (!pro) {
            throw new common_1.NotFoundException(`Pro ${id} not found`);
        }
        return pro;
    }
    async ensureTimeWindowBelongsToPro(proId, timeWindowId) {
        const timeWindow = await this.prismaService.prisma.proTimeWindow.findUnique({
            where: { id: timeWindowId },
            select: { id: true, proId: true },
        });
        if (!timeWindow || timeWindow.proId !== proId) {
            throw new common_1.NotFoundException(`Time window ${timeWindowId} not found for pro ${proId}`);
        }
    }
    async ensureBadgeBelongsToPro(proId, badgeId) {
        const badge = await this.prismaService.prisma.proBadge.findUnique({
            where: { id: badgeId },
            select: { id: true, proId: true },
        });
        if (!badge || badge.proId !== proId) {
            throw new common_1.NotFoundException(`Badge ${badgeId} not found for pro ${proId}`);
        }
    }
    async ensureExtraBelongsToPro(proId, extraId) {
        const extra = await this.prismaService.prisma.proExtra.findUnique({
            where: { id: extraId },
            select: { id: true, proId: true },
        });
        if (!extra || extra.proId !== proId) {
            throw new common_1.NotFoundException(`Extra ${extraId} not found for pro ${proId}`);
        }
    }
};
exports.ProsService = ProsService;
exports.ProsService = ProsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProsService);
//# sourceMappingURL=pros.service.js.map