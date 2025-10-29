import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

type AcceleratedPrismaClient = PrismaClient;

function createAcceleratedClient(): AcceleratedPrismaClient {
  return new PrismaClient().$extends(
    withAccelerate(),
  ) as unknown as PrismaClient;
}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly client: AcceleratedPrismaClient;

  constructor() {
    this.client = createAcceleratedClient();
  }

  get prisma(): AcceleratedPrismaClient {
    return this.client;
  }

  async onModuleInit(): Promise<void> {
    await this.client.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }
}
