import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(dto: CreateReviewDto) {
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

  async findOne(id: number) {
    const review = await this.prismaService.prisma.review.findUnique({
      where: { id },
      include: this.defaultIncludes(),
    });

    if (!review) {
      throw new NotFoundException(`Review ${id} not found`);
    }

    return review;
  }

  async update(id: number, dto: UpdateReviewDto) {
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

  async remove(id: number) {
    await this.ensureReviewExists(id);

    await this.prismaService.prisma.review.delete({
      where: { id },
    });
  }

  private defaultIncludes() {
    return {
      pro: true,
      user: true,
      booking: true,
    };
  }

  private async ensureReviewExists(id: number) {
    const review = await this.prismaService.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException(`Review ${id} not found`);
    }

    return review;
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

  private async ensureUserExists(id: number) {
    const user = await this.prismaService.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
  }

  private async ensureBookingExists(id: number) {
    const booking = await this.prismaService.prisma.booking.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${id} not found`);
    }
  }
}
