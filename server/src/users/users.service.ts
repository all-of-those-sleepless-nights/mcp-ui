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
    });
  }

  async findAll() {
    return this.prismaService.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prismaService.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.ensureExists(id);

    return this.prismaService.prisma.user.update({
      where: { id },
      data: {
        email: dto.email,
        name: dto.name,
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);

    await this.prismaService.prisma.user.delete({
      where: { id },
    });
  }

  private async ensureExists(id: string) {
    const exists = await this.prismaService.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException(`User ${id} not found`);
    }
  }
}
