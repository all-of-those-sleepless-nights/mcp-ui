import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProBadgeDto } from './dto/create-pro-badge.dto';
import { CreateProDto } from './dto/create-pro.dto';
import { CreateProExtraDto } from './dto/create-pro-extra.dto';
import { CreateProTimeWindowDto } from './dto/create-pro-time-window.dto';
import { UpdateProBadgeDto } from './dto/update-pro-badge.dto';
import { UpdateProDto } from './dto/update-pro.dto';
import { UpdateProExtraDto } from './dto/update-pro-extra.dto';
import { UpdateProTimeWindowDto } from './dto/update-pro-time-window.dto';

@Injectable()
export class ProsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(dto: CreateProDto) {
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

  async findOne(id: number) {
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
      throw new NotFoundException(`Pro ${id} not found`);
    }

    return pro;
  }

  async update(id: number, dto: UpdateProDto) {
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

  async remove(id: number) {
    await this.ensureProExists(id);

    await this.prismaService.prisma.pro.delete({
      where: { id },
    });
  }

  async addTimeWindow(proId: number, dto: CreateProTimeWindowDto) {
    await this.ensureProExists(proId);

    return this.prismaService.prisma.proTimeWindow.create({
      data: {
        proId,
        start: dto.start,
        end: dto.end,
      },
    });
  }

  async listTimeWindows(proId: number) {
    await this.ensureProExists(proId);

    return this.prismaService.prisma.proTimeWindow.findMany({
      where: { proId },
      orderBy: { start: 'asc' },
    });
  }

  async updateTimeWindow(
    proId: number,
    timeWindowId: number,
    dto: UpdateProTimeWindowDto,
  ) {
    await this.ensureTimeWindowBelongsToPro(proId, timeWindowId);

    return this.prismaService.prisma.proTimeWindow.update({
      where: { id: timeWindowId },
      data: {
        start: dto.start,
        end: dto.end,
      },
    });
  }

  async removeTimeWindow(proId: number, timeWindowId: number) {
    await this.ensureTimeWindowBelongsToPro(proId, timeWindowId);

    await this.prismaService.prisma.proTimeWindow.delete({
      where: { id: timeWindowId },
    });
  }

  async addBadge(proId: number, dto: CreateProBadgeDto) {
    await this.ensureProExists(proId);

    return this.prismaService.prisma.proBadge.create({
      data: {
        proId,
        label: dto.label,
      },
    });
  }

  async listBadges(proId: number) {
    await this.ensureProExists(proId);

    return this.prismaService.prisma.proBadge.findMany({
      where: { proId },
      orderBy: { label: 'asc' },
    });
  }

  async updateBadge(
    proId: number,
    badgeId: number,
    dto: UpdateProBadgeDto,
  ) {
    await this.ensureBadgeBelongsToPro(proId, badgeId);

    return this.prismaService.prisma.proBadge.update({
      where: { id: badgeId },
      data: {
        label: dto.label,
      },
    });
  }

  async removeBadge(proId: number, badgeId: number) {
    await this.ensureBadgeBelongsToPro(proId, badgeId);

    await this.prismaService.prisma.proBadge.delete({
      where: { id: badgeId },
    });
  }

  async addExtra(proId: number, dto: CreateProExtraDto) {
    await this.ensureProExists(proId);

    return this.prismaService.prisma.proExtra.create({
      data: {
        proId,
        name: dto.name,
        price: dto.price,
      },
    });
  }

  async listExtras(proId: number) {
    await this.ensureProExists(proId);

    return this.prismaService.prisma.proExtra.findMany({
      where: { proId },
      orderBy: { name: 'asc' },
    });
  }

  async updateExtra(proId: number, extraId: number, dto: UpdateProExtraDto) {
    await this.ensureExtraBelongsToPro(proId, extraId);

    return this.prismaService.prisma.proExtra.update({
      where: { id: extraId },
      data: {
        name: dto.name,
        price: dto.price,
      },
    });
  }

  async removeExtra(proId: number, extraId: number) {
    await this.ensureExtraBelongsToPro(proId, extraId);

    await this.prismaService.prisma.proExtra.delete({
      where: { id: extraId },
    });
  }

  private async ensureServiceExists(serviceId: number) {
    const service = await this.prismaService.prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true },
    });

    if (!service) {
      throw new NotFoundException(`Service ${serviceId} not found`);
    }
  }

  private async ensureProExists(id: number) {
    const pro = await this.prismaService.prisma.pro.findUnique({
      where: { id },
    });

    if (!pro) {
      throw new NotFoundException(`Pro ${id} not found`);
    }

    return pro;
  }

  private async ensureTimeWindowBelongsToPro(proId: number, timeWindowId: number) {
    const timeWindow =
      await this.prismaService.prisma.proTimeWindow.findUnique({
        where: { id: timeWindowId },
        select: { id: true, proId: true },
      });

    if (!timeWindow || timeWindow.proId !== proId) {
      throw new NotFoundException(
        `Time window ${timeWindowId} not found for pro ${proId}`,
      );
    }
  }

  private async ensureBadgeBelongsToPro(proId: number, badgeId: number) {
    const badge = await this.prismaService.prisma.proBadge.findUnique({
      where: { id: badgeId },
      select: { id: true, proId: true },
    });

    if (!badge || badge.proId !== proId) {
      throw new NotFoundException(
        `Badge ${badgeId} not found for pro ${proId}`,
      );
    }
  }

  private async ensureExtraBelongsToPro(proId: number, extraId: number) {
    const extra = await this.prismaService.prisma.proExtra.findUnique({
      where: { id: extraId },
      select: { id: true, proId: true },
    });

    if (!extra || extra.proId !== proId) {
      throw new NotFoundException(
        `Extra ${extraId} not found for pro ${proId}`,
      );
    }
  }
}
