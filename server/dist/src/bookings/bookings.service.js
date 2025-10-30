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
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BookingsService = class BookingsService {
    constructor(prismaService) {
        this.prismaService = prismaService;
    }
    async create(dto) {
        await this.ensureProExists(dto.proId);
        await this.ensureServiceExists(dto.serviceId);
        if (dto.userId) {
            await this.ensureUserExists(dto.userId);
        }
        return this.prismaService.prisma.booking.create({
            data: {
                proId: dto.proId,
                serviceId: dto.serviceId,
                userId: dto.userId,
                start: new Date(dto.start),
                end: new Date(dto.end),
                status: dto.status,
                priceEstimate: dto.priceEstimate,
                address: dto.address,
                instructions: dto.instructions,
                quoteId: dto.quoteId,
                rating: dto.rating,
                reviewText: dto.reviewText,
            },
            include: this.defaultIncludes(),
        });
    }
    async findAll() {
        return this.prismaService.prisma.booking.findMany({
            include: this.defaultIncludes(),
            orderBy: { start: 'desc' },
        });
    }
    async findOne(id) {
        const booking = await this.prismaService.prisma.booking.findUnique({
            where: { id },
            include: this.defaultIncludes(),
        });
        if (!booking) {
            throw new common_1.NotFoundException(`Booking ${id} not found`);
        }
        return booking;
    }
    async update(id, dto) {
        const booking = await this.ensureBookingExists(id);
        if (dto.proId && dto.proId !== booking.proId) {
            await this.ensureProExists(dto.proId);
        }
        if (dto.serviceId && dto.serviceId !== booking.serviceId) {
            await this.ensureServiceExists(dto.serviceId);
        }
        if (dto.userId && dto.userId !== booking.userId) {
            await this.ensureUserExists(dto.userId);
        }
        return this.prismaService.prisma.booking.update({
            where: { id },
            data: {
                proId: dto.proId,
                serviceId: dto.serviceId,
                userId: dto.userId,
                start: dto.start ? new Date(dto.start) : undefined,
                end: dto.end ? new Date(dto.end) : undefined,
                status: dto.status,
                priceEstimate: dto.priceEstimate,
                address: dto.address,
                instructions: dto.instructions,
                quoteId: dto.quoteId,
                rating: dto.rating,
                reviewText: dto.reviewText,
            },
            include: this.defaultIncludes(),
        });
    }
    async remove(id) {
        await this.ensureBookingExists(id);
        await this.prismaService.prisma.booking.delete({
            where: { id },
        });
    }
    defaultIncludes() {
        return {
            pro: true,
            service: true,
            user: true,
            review: true,
        };
    }
    async ensureBookingExists(id) {
        const booking = await this.prismaService.prisma.booking.findUnique({
            where: { id },
        });
        if (!booking) {
            throw new common_1.NotFoundException(`Booking ${id} not found`);
        }
        return booking;
    }
    async ensureProExists(id) {
        const pro = await this.prismaService.prisma.pro.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!pro) {
            throw new common_1.NotFoundException(`Pro ${id} not found`);
        }
    }
    async ensureServiceExists(id) {
        const service = await this.prismaService.prisma.service.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!service) {
            throw new common_1.NotFoundException(`Service ${id} not found`);
        }
    }
    async ensureUserExists(id) {
        const user = await this.prismaService.prisma.user.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!user) {
            throw new common_1.NotFoundException(`User ${id} not found`);
        }
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map