import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { RateJobDto } from './dto/rate-job.dto';
import { ReviewsService } from './reviews.service';
export declare class ReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
    create(dto: CreateReviewDto): Promise<{
        user: {
            createdAt: Date;
            updatedAt: Date;
            id: number;
            name: string;
            email: string;
        };
        pro: {
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
        };
        booking: {
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
        };
    } & {
        review: string | null;
        proId: number;
        userId: number | null;
        rating: number;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        bookingId: number | null;
    }>;
    rateJob(dto: RateJobDto): Promise<{
        readonly success: true;
    }>;
    findAll(): Promise<({
        user: {
            createdAt: Date;
            updatedAt: Date;
            id: number;
            name: string;
            email: string;
        };
        pro: {
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
        };
        booking: {
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
        };
    } & {
        review: string | null;
        proId: number;
        userId: number | null;
        rating: number;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        bookingId: number | null;
    })[]>;
    findOne(id: number): Promise<{
        user: {
            createdAt: Date;
            updatedAt: Date;
            id: number;
            name: string;
            email: string;
        };
        pro: {
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
        };
        booking: {
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
        };
    } & {
        review: string | null;
        proId: number;
        userId: number | null;
        rating: number;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        bookingId: number | null;
    }>;
    update(id: number, dto: UpdateReviewDto): Promise<{
        user: {
            createdAt: Date;
            updatedAt: Date;
            id: number;
            name: string;
            email: string;
        };
        pro: {
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
        };
        booking: {
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
        };
    } & {
        review: string | null;
        proId: number;
        userId: number | null;
        rating: number;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        bookingId: number | null;
    }>;
    remove(id: number): Promise<void>;
}
