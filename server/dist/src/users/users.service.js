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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    constructor(prismaService) {
        this.prismaService = prismaService;
    }
    async create(dto) {
        return this.prismaService.prisma.user.create({
            data: {
                email: dto.email,
                name: dto.name,
            },
            include: {
                bookings: true,
                reviews: true,
            },
        });
    }
    async findAll() {
        return this.prismaService.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                bookings: true,
                reviews: true,
            },
        });
    }
    async findOne(id) {
        const user = await this.prismaService.prisma.user.findUnique({
            where: { id },
            include: {
                bookings: true,
                reviews: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException(`User ${id} not found`);
        }
        return user;
    }
    async update(id, dto) {
        await this.ensureExists(id);
        return this.prismaService.prisma.user.update({
            where: { id },
            data: {
                email: dto.email,
                name: dto.name,
            },
            include: {
                bookings: true,
                reviews: true,
            },
        });
    }
    async remove(id) {
        await this.ensureExists(id);
        await this.prismaService.prisma.user.delete({
            where: { id },
        });
    }
    async ensureExists(id) {
        const exists = await this.prismaService.prisma.user.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!exists) {
            throw new common_1.NotFoundException(`User ${id} not found`);
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map