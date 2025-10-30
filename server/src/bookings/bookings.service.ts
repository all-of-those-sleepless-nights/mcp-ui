import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(dto: CreateBookingDto) {
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
        address: dto.address as Prisma.JsonValue,
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

  async findOne(id: number) {
    const booking = await this.prismaService.prisma.booking.findUnique({
      where: { id },
      include: this.defaultIncludes(),
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${id} not found`);
    }

    return booking;
  }

  async update(id: number, dto: UpdateBookingDto) {
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
        address: dto.address as Prisma.JsonValue,
        instructions: dto.instructions,
        quoteId: dto.quoteId,
        rating: dto.rating,
        reviewText: dto.reviewText,
      },
      include: this.defaultIncludes(),
    });
  }

  async remove(id: number) {
    await this.ensureBookingExists(id);

    await this.prismaService.prisma.booking.delete({
      where: { id },
    });
  }

  private defaultIncludes() {
    return {
      pro: true,
      service: true,
      user: true,
      review: true,
    };
  }

  private async ensureBookingExists(id: number) {
    const booking = await this.prismaService.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${id} not found`);
    }

    return booking;
  }

  private async ensureProExists(id: number) {
    const pro = await this.prismaService.prisma.pro.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!pro) {
      throw new NotFoundException(`Pro ${id} not found`);
    }
  }

  private async ensureServiceExists(id: number) {
    const service = await this.prismaService.prisma.service.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!service) {
      throw new NotFoundException(`Service ${id} not found`);
    }
  }

  private async ensureUserExists(id: number) {
    const user = await this.prismaService.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
  }
}
