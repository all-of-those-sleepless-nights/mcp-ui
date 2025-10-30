export declare class CreateBookingDto {
    proId: number;
    serviceId: number;
    userId?: number;
    start: string;
    end: string;
    status: string;
    priceEstimate: number;
    address: Record<string, unknown>;
    instructions?: string;
    quoteId?: string;
    rating?: number;
    reviewText?: string;
}
