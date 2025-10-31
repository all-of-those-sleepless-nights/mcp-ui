import type { PrismaClient } from '@prisma/client';
import { type Tool, type CallToolResult, type Resource, type ResourceTemplate } from '@modelcontextprotocol/sdk/types.js';
export declare const HOMEFLOW_TEMPLATE_URI = "ui://widget/homeflow.html";
export declare const HOMEFLOW_WIDGET_META: {
    readonly 'openai/outputTemplate': "ui://widget/homeflow.html";
    readonly 'openai/widgetAccessible': true;
    readonly 'openai/resultCanProduceWidget': true;
    readonly 'openai/toolInvocation/invoking': "Planning your HomeFlow experience…";
    readonly 'openai/toolInvocation/invoked': "HomeFlow is ready!";
};
declare const HOMEFLOW_SERVICES: readonly ["cleaning", "plumbing", "electrical", "handyman", "pest_control", "ac_service", "moving"];
type HomeflowServiceName = (typeof HOMEFLOW_SERVICES)[number];
type HomeflowSlot = {
    start: string;
    end: string;
};
type HomeflowMapMarker = {
    id: string;
    name: string;
    coords: [number, number];
    rating?: number;
    priceFrom?: number;
    currency?: string;
    subtitle?: string;
    badges?: string[];
    actions?: HomeflowAction[];
};
type HomeflowActionVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type HomeflowAction = {
    type: 'tool';
    label: string;
    tool: string;
    params?: Record<string, unknown>;
    variant?: HomeflowActionVariant;
} | {
    type: 'followup';
    label: string;
    prompt: string;
    variant?: HomeflowActionVariant;
} | {
    type: 'link';
    label: string;
    href: string;
    external?: boolean;
    variant?: HomeflowActionVariant;
};
type HomeflowSlotOption = {
    start: string;
    end: string;
    label: string;
    primaryAction?: HomeflowAction;
    secondaryAction?: HomeflowAction;
};
type HomeflowProSummary = {
    id: string;
    service: HomeflowServiceName;
    name: string;
    image?: string;
    imageAlt?: string;
    rating?: number;
    reviews?: number;
    priceFrom?: number;
    currency: string;
    location: {
        lat: number;
        lng: number;
    };
    badges: string[];
    workingDays: number[];
    timeWindows: {
        start: string;
        end: string;
    }[];
    baseQuote: {
        low: number;
        high: number;
    };
    extrasPricing: Record<string, number>;
    serviceRadiusKm: number;
    distanceKm?: number;
    nextAvailable?: string;
    actions?: HomeflowAction[];
};
type HomeflowQuoteConfig = {
    quoteId: string;
    service: HomeflowServiceName;
    currency: string;
    estimateLow: number;
    estimateHigh: number;
    expiresAt: string;
    proId?: string;
    actions?: HomeflowAction[];
};
type HomeflowJobCard = {
    jobId: string;
    service: HomeflowServiceName;
    status: string;
    pro: {
        id: string;
        name?: string;
        image?: string;
    };
    slot: HomeflowSlot;
    currency: string;
    priceEstimate: number;
    instructions?: string;
    badges?: string[];
    actions?: HomeflowAction[];
    quoteId?: string;
    review?: string;
    rating?: number;
};
type HomeflowReview = {
    jobId: string;
    rating: number;
    review?: string;
    updatedAt: string;
};
type HomeflowUiConfig = {
    view: string;
    title: string;
    subtitle?: string;
    description?: string;
    timestamp: string;
    pros?: HomeflowProSummary[];
    jobs?: HomeflowJobCard[];
    job?: HomeflowJobCard;
    quote?: HomeflowQuoteConfig;
    slotOptions?: HomeflowSlotOption[];
    slots?: HomeflowSlotOption[];
    notifications?: string[];
    quickActions?: HomeflowAction[];
    pricingActions?: HomeflowAction[];
    manageActions?: HomeflowAction[];
    map?: {
        center: [number, number];
        markers: HomeflowMapMarker[];
        selectedId?: string;
    };
    pro?: HomeflowProSummary & {
        recentReviews?: HomeflowReview[];
    };
    reviews?: HomeflowReview[];
    context?: Record<string, unknown>;
    viewModes?: Array<'carousel' | 'list' | 'map'>;
    defaultView?: 'carousel' | 'list' | 'map';
    emptyState?: string;
    query?: Record<string, unknown>;
    reviewForm?: {
        jobId: string;
        proName: string;
        service: string;
        rating?: number;
        review?: string | null;
    };
};
type HomeflowAccountContext = {
    subject?: string;
    name?: string;
    email?: string;
    picture?: string;
};
export declare class HomeflowMcpAdapter {
    private readonly prisma;
    private readonly templatePromise;
    private readonly apiBase;
    private accountContext?;
    constructor(prisma: PrismaClient);
    listResources(): Promise<Resource[]>;
    listResourceTemplates(): Promise<ResourceTemplate[]>;
    listTools(): Promise<Tool[]>;
    setAccountContext(context: HomeflowAccountContext | undefined): void;
    readResource(): Promise<{
        html: string;
        config: HomeflowUiConfig;
    }>;
    handleTool(name: string, args: unknown): Promise<CallToolResult>;
    private handleHome;
    private buildHomeConfig;
    private handleSearchPros;
    private handleGetSlots;
    private handleGetQuote;
    private handleBookJob;
    private handleUpdateJob;
    private handleCompleteJob;
    private handleCancelJob;
    private handleJobStatus;
    private handleRateJobForm;
    private handleRateJob;
    private handleMyReviews;
    private handleProReviews;
    private handleGoogleAccount;
    private loadJobCards;
    private refreshProRatings;
    private enrichConfig;
    private buildCallResult;
}
export {};
