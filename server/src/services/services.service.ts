import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { CreateServiceExtraDto } from './dto/create-service-extra.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { UpdateServiceExtraDto } from './dto/update-service-extra.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(dto: CreateServiceDto) {
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

  async findOne(id: number) {
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
      throw new NotFoundException(`Service ${id} not found`);
    }

    return service;
  }

  async update(id: number, dto: UpdateServiceDto) {
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

  async remove(id: number) {
    await this.ensureExists(id);

    await this.prismaService.prisma.service.delete({
      where: { id },
    });
  }

  async addExtra(serviceId: number, dto: CreateServiceExtraDto) {
    await this.ensureExists(serviceId);

    return this.prismaService.prisma.serviceExtra.create({
      data: {
        serviceId,
        name: dto.name,
        price: dto.price,
      },
    });
  }

  async listExtras(serviceId: number) {
    await this.ensureExists(serviceId);

    return this.prismaService.prisma.serviceExtra.findMany({
      where: { serviceId },
      orderBy: { name: 'asc' },
    });
  }

  async updateExtra(
    serviceId: number,
    extraId: number,
    dto: UpdateServiceExtraDto,
  ) {
    await this.ensureExtraBelongsToService(serviceId, extraId);

    return this.prismaService.prisma.serviceExtra.update({
      where: { id: extraId },
      data: {
        name: dto.name,
        price: dto.price,
      },
    });
  }

  async removeExtra(serviceId: number, extraId: number) {
    await this.ensureExtraBelongsToService(serviceId, extraId);

    await this.prismaService.prisma.serviceExtra.delete({
      where: { id: extraId },
    });
  }

  private async ensureExists(id: number) {
    const exists = await this.prismaService.prisma.service.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException(`Service ${id} not found`);
    }
  }

  private async ensureExtraBelongsToService(serviceId: number, extraId: number) {
    const extra = await this.prismaService.prisma.serviceExtra.findUnique({
      where: { id: extraId },
      select: { id: true, serviceId: true },
    });

    if (!extra || extra.serviceId !== serviceId) {
      throw new NotFoundException(
        `Extra ${extraId} not found for service ${serviceId}`,
      );
    }
  }
}
