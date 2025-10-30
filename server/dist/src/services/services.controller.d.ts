import { CreateServiceDto } from './dto/create-service.dto';
import { CreateServiceExtraDto } from './dto/create-service-extra.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { UpdateServiceExtraDto } from './dto/update-service-extra.dto';
import { ServicesService } from './services.service';
export declare class ServicesController {
    private readonly servicesService;
    constructor(servicesService: ServicesService);
    create(dto: CreateServiceDto): Promise<{
        extras: {
            serviceId: number;
            id: number;
            name: string;
            price: number;
        }[];
    } & {
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
    }>;
    findAll(): Promise<({
        extras: {
            serviceId: number;
            id: number;
            name: string;
            price: number;
        }[];
    } & {
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
    })[]>;
    findOne(id: number): Promise<{
        extras: {
            serviceId: number;
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
        pros: ({
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
        })[];
    } & {
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
    }>;
    update(id: number, dto: UpdateServiceDto): Promise<{
        extras: {
            serviceId: number;
            id: number;
            name: string;
            price: number;
        }[];
    } & {
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
    }>;
    remove(id: number): Promise<void>;
    createExtra(serviceId: number, dto: CreateServiceExtraDto): Promise<{
        serviceId: number;
        id: number;
        name: string;
        price: number;
    }>;
    listExtras(serviceId: number): Promise<{
        serviceId: number;
        id: number;
        name: string;
        price: number;
    }[]>;
    updateExtra(serviceId: number, extraId: number, dto: UpdateServiceExtraDto): Promise<{
        serviceId: number;
        id: number;
        name: string;
        price: number;
    }>;
    removeExtra(serviceId: number, extraId: number): Promise<void>;
}
