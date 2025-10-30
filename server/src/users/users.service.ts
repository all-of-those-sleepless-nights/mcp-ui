import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user';
import { UpdateUserDto } from './dto/update-user';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(dto: CreateUserDto) {
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

  async findOne(id: number) {
    const user = await this.prismaService.prisma.user.findUnique({
      where: { id },
      include: {
        bookings: true,
        reviews: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
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

  async remove(id: number) {
    await this.ensureExists(id);

    await this.prismaService.prisma.user.delete({
      where: { id },
    });
  }

  private async ensureExists(id: number) {
    const exists = await this.prismaService.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException(`User ${id} not found`);
    }
  }
}
