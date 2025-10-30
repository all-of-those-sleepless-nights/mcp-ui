import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProBadgeDto } from './dto/create-pro-badge.dto';
import { CreateProDto } from './dto/create-pro.dto';
import { CreateProExtraDto } from './dto/create-pro-extra.dto';
import { CreateProTimeWindowDto } from './dto/create-pro-time-window.dto';
import { UpdateProBadgeDto } from './dto/update-pro-badge.dto';
import { UpdateProDto } from './dto/update-pro.dto';
import { UpdateProExtraDto } from './dto/update-pro-extra.dto';
import { UpdateProTimeWindowDto } from './dto/update-pro-time-window.dto';
export declare class ProsService {
    private readonly prismaService;
    constructor(prismaService: PrismaService);
    create(dto: CreateProDto): Promise<{
        timeWindows: {
            proId: number;
            start: string;
            end: string;
            id: number;
        }[];
        badges: {
            proId: number;
            id: number;
            label: string;
        }[];
        extras: {
            proId: number;
            id: number;
            name: string;
            price: number;
        }[];
    } & {
        serviceId: number;
        rating: number;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        name: string;
        slug: string;
        image: string;
        imageAlt: string;
        reviewsCount: number;
        priceFrom: number;
        currency: string;
        latitude: number;
        longitude: number;
        serviceRadiusKm: number;
        workingDays: number[];
        baseQuoteLow: number;
        baseQuoteHigh: number;
    }>;
    findAll(): Promise<({
        service: {
            createdAt: Date;
            updatedAt: Date;
            id: number;
            slug: string;
            title: string;
            description: string | null;
            defaultPriceLow: number;
            defaultPriceHigh: number;
            defaultRadiusKm: number | null;
            defaultWorkingDays: number[];
        };
        timeWindows: {
            proId: number;
            start: string;
            end: string;
            id: number;
        }[];
        badges: {
            proId: number;
            id: number;
            label: string;
        }[];
        extras: {
            proId: number;
            id: number;
            name: string;
            price: number;
        }[];
    } & {
        serviceId: number;
        rating: number;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        name: string;
        slug: string;
        image: string;
        imageAlt: string;
        reviewsCount: number;
        priceFrom: number;
        currency: string;
        latitude: number;
        longitude: number;
        serviceRadiusKm: number;
        workingDays: number[];
        baseQuoteLow: number;
        baseQuoteHigh: number;
    })[]>;
    findOne(id: number): Promise<{
        service: {
            createdAt: Date;
            updatedAt: Date;
            id: number;
            slug: string;
            title: string;
            description: string | null;
            defaultPriceLow: number;
            defaultPriceHigh: number;
            defaultRadiusKm: number | null;
            defaultWorkingDays: number[];
        };
        timeWindows: {
            proId: number;
            start: string;
            end: string;
            id: number;
        }[];
        badges: {
            proId: number;
            id: number;
            label: string;
        }[];
        extras: {
            proId: number;
            id: number;
            name: string;
            price: number;
        }[];
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
        serviceId: number;
        rating: number;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        name: string;
        slug: string;
        image: string;
        imageAlt: string;
        reviewsCount: number;
        priceFrom: number;
        currency: string;
        latitude: number;
        longitude: number;
        serviceRadiusKm: number;
        workingDays: number[];
        baseQuoteLow: number;
        baseQuoteHigh: number;
    }>;
    update(id: number, dto: UpdateProDto): Promise<{
        timeWindows: {
            proId: number;
            start: string;
            end: string;
            id: number;
        }[];
        badges: {
            proId: number;
            id: number;
            label: string;
        }[];
        extras: {
            proId: number;
            id: number;
            name: string;
            price: number;
        }[];
    } & {
        serviceId: number;
        rating: number;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        name: string;
        slug: string;
        image: string;
        imageAlt: string;
        reviewsCount: number;
        priceFrom: number;
        currency: string;
        latitude: number;
        longitude: number;
        serviceRadiusKm: number;
        workingDays: number[];
        baseQuoteLow: number;
        baseQuoteHigh: number;
    }>;
    remove(id: number): Promise<void>;
    addTimeWindow(proId: number, dto: CreateProTimeWindowDto): Promise<{
        proId: number;
        start: string;
        end: string;
        id: number;
    }>;
    listTimeWindows(proId: number): Promise<{
        proId: number;
        start: string;
        end: string;
        id: number;
    }[]>;
    updateTimeWindow(proId: number, timeWindowId: number, dto: UpdateProTimeWindowDto): Promise<{
        proId: number;
        start: string;
        end: string;
        id: number;
    }>;
    removeTimeWindow(proId: number, timeWindowId: number): Promise<void>;
    addBadge(proId: number, dto: CreateProBadgeDto): Promise<{
        proId: number;
        id: number;
        label: string;
    }>;
    listBadges(proId: number): Promise<{
        proId: number;
        id: number;
        label: string;
    }[]>;
    updateBadge(proId: number, badgeId: number, dto: UpdateProBadgeDto): Promise<{
        proId: number;
        id: number;
        label: string;
    }>;
    removeBadge(proId: number, badgeId: number): Promise<void>;
    addExtra(proId: number, dto: CreateProExtraDto): Promise<{
        proId: number;
        id: number;
        name: string;
        price: number;
    }>;
    listExtras(proId: number): Promise<{
        proId: number;
        id: number;
        name: string;
        price: number;
    }[]>;
    updateExtra(proId: number, extraId: number, dto: UpdateProExtraDto): Promise<{
        proId: number;
        id: number;
        name: string;
        price: number;
    }>;
    removeExtra(proId: number, extraId: number): Promise<void>;
    private ensureServiceExists;
    private ensureProExists;
    private ensureTimeWindowBelongsToPro;
    private ensureBadgeBelongsToPro;
    private ensureExtraBelongsToPro;
}
