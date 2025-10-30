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
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ReviewsService = class ReviewsService {
    constructor(prismaService) {
        this.prismaService = prismaService;
    }
    async create(dto) {
        await this.ensureProExists(dto.proId);
        if (dto.userId) {
            await this.ensureUserExists(dto.userId);
        }
        if (dto.bookingId) {
            await this.ensureBookingExists(dto.bookingId);
        }
        return this.prismaService.prisma.review.create({
            data: {
                proId: dto.proId,
                userId: dto.userId,
                bookingId: dto.bookingId,
                rating: dto.rating,
                review: dto.review,
            },
            include: this.defaultIncludes(),
        });
    }
    async findAll() {
        return this.prismaService.prisma.review.findMany({
            include: this.defaultIncludes(),
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const review = await this.prismaService.prisma.review.findUnique({
            where: { id },
            include: this.defaultIncludes(),
        });
        if (!review) {
            throw new common_1.NotFoundException(`Review ${id} not found`);
        }
        return review;
    }
    async update(id, dto) {
        const review = await this.ensureReviewExists(id);
        if (dto.proId && dto.proId !== review.proId) {
            await this.ensureProExists(dto.proId);
        }
        if (dto.userId && dto.userId !== review.userId) {
            await this.ensureUserExists(dto.userId);
        }
        if (dto.bookingId && dto.bookingId !== review.bookingId) {
            await this.ensureBookingExists(dto.bookingId);
        }
        return this.prismaService.prisma.review.update({
            where: { id },
            data: {
                proId: dto.proId,
                userId: dto.userId,
                bookingId: dto.bookingId,
                rating: dto.rating,
                review: dto.review,
            },
            include: this.defaultIncludes(),
        });
    }
    async remove(id) {
        await this.ensureReviewExists(id);
        await this.prismaService.prisma.review.delete({
            where: { id },
        });
    }
    defaultIncludes() {
        return {
            pro: true,
            user: true,
            booking: true,
        };
    }
    async ensureReviewExists(id) {
        const review = await this.prismaService.prisma.review.findUnique({
            where: { id },
        });
        if (!review) {
            throw new common_1.NotFoundException(`Review ${id} not found`);
        }
        return review;
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
    async ensureUserExists(id) {
        const user = await this.prismaService.prisma.user.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!user) {
            throw new common_1.NotFoundException(`User ${id} not found`);
        }
    }
    async ensureBookingExists(id) {
        const booking = await this.prismaService.prisma.booking.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!booking) {
            throw new common_1.NotFoundException(`Booking ${id} not found`);
        }
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map