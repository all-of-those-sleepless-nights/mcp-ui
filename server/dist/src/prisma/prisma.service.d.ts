import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client/edge';
type AcceleratedPrismaClient = PrismaClient;
export declare class PrismaService implements OnModuleInit, OnModuleDestroy {
    private readonly client;
    constructor();
    get prisma(): AcceleratedPrismaClient;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
export {};
