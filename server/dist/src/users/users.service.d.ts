import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user';
import { UpdateUserDto } from './dto/update-user';
export declare class UsersService {
    private readonly prismaService;
    constructor(prismaService: PrismaService);
    create(dto: CreateUserDto): Promise<{
        bookings: {
            proId: number;
            serviceId: number;
            userId: number | null;
            start: Date;
            end: Date;
            status: string;
            priceEstimate: number;
            address: import("@prisma/client/runtime/library").JsonValue;
            instructions: string | null;
            quoteId: string | null;
            rating: number | null;
            reviewText: string | null;
            createdAt: Date;
            updatedAt: Date;
            id: number;
        }[];
        reviews: {
            review: string | null;
            proId: number;
            userId: number | null;
            rating: number;
            createdAt: Date;
            updatedAt: Date;
            id: number;
            bookingId: number | null;
        }[];
    } & {
        createdAt: Date;
        updatedAt: Date;
        id: number;
        name: string;
        email: string;
    }>;
    findAll(): Promise<({
        bookings: {
            proId: number;
            serviceId: number;
            userId: number | null;
            start: Date;
            end: Date;
            status: string;
            priceEstimate: number;
            address: import("@prisma/client/runtime/library").JsonValue;
            instructions: string | null;
            quoteId: string | null;
            rating: number | null;
            reviewText: string | null;
            createdAt: Date;
            updatedAt: Date;
            id: number;
        }[];
        reviews: {
            review: string | null;
            proId: number;
            userId: number | null;
            rating: number;
            createdAt: Date;
            updatedAt: Date;
            id: number;
            bookingId: number | null;
        }[];
    } & {
        createdAt: Date;
        updatedAt: Date;
        id: number;
        name: string;
        email: string;
    })[]>;
    findOne(id: number): Promise<{
        bookings: {
            proId: number;
            serviceId: number;
            userId: number | null;
            start: Date;
            end: Date;
            status: string;
            priceEstimate: number;
            address: import("@prisma/client/runtime/library").JsonValue;
            instructions: string | null;
            quoteId: string | null;
            rating: number | null;
            reviewText: string | null;
            createdAt: Date;
            updatedAt: Date;
            id: number;
        }[];
        reviews: {
            review: string | null;
            proId: number;
            userId: number | null;
            rating: number;
            createdAt: Date;
            updatedAt: Date;
            id: number;
            bookingId: number | null;
        }[];
    } & {
        createdAt: Date;
        updatedAt: Date;
        id: number;
        name: string;
        email: string;
    }>;
    update(id: number, dto: UpdateUserDto): Promise<{
        bookings: {
            proId: number;
            serviceId: number;
            userId: number | null;
            start: Date;
            end: Date;
            status: string;
            priceEstimate: number;
            address: import("@prisma/client/runtime/library").JsonValue;
            instructions: string | null;
            quoteId: string | null;
            rating: number | null;
            reviewText: string | null;
            createdAt: Date;
            updatedAt: Date;
            id: number;
        }[];
        reviews: {
            review: string | null;
            proId: number;
            userId: number | null;
            rating: number;
            createdAt: Date;
            updatedAt: Date;
            id: number;
            bookingId: number | null;
        }[];
    } & {
        createdAt: Date;
        updatedAt: Date;
        id: number;
        name: string;
        email: string;
    }>;
    remove(id: number): Promise<void>;
    private ensureExists;
}
