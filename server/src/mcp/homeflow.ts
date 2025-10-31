import { readFile } from 'node:fs/promises';
import * as path from 'node:path';

import type {
  Prisma,
  PrismaClient,
  Service,
  Pro,
  ProBadge,
  ProExtra,
  ProTimeWindow,
  Quote,
  Booking,
  Review,
} from '@prisma/client';
import { type Tool, type CallToolResult, type Resource, type ResourceTemplate } from '@modelcontextprotocol/sdk/types.js';

export const HOMEFLOW_TEMPLATE_URI = 'ui://widget/homeflow.html';
const HOMEFLOW_TEMPLATE_PLACEHOLDER = '__HOMEFLOW_CONFIG_JSON__';

export const HOMEFLOW_WIDGET_META = {
  'openai/outputTemplate': HOMEFLOW_TEMPLATE_URI,
  'openai/widgetAccessible': true,
  'openai/resultCanProduceWidget': true,
  'openai/toolInvocation/invoking': 'Planning your HomeFlow experience…',
  'openai/toolInvocation/invoked': 'HomeFlow is ready!',
} as const;

const HOMEFLOW_SERVICES = [
  'cleaning',
  'plumbing',
  'electrical',
  'handyman',
  'pest_control',
  'ac_service',
  'moving',
] as const;

type HomeflowServiceName = (typeof HOMEFLOW_SERVICES)[number];

type HomeflowSlot = { start: string; end: string };
type HomeflowLocation = { lat: number; lng: number; radiusKm?: number };
type HomeflowAddress = {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  notes?: string;
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

type HomeflowAction =
  | { type: 'tool'; label: string; tool: string; params?: Record<string, unknown>; variant?: HomeflowActionVariant }
  | { type: 'followup'; label: string; prompt: string; variant?: HomeflowActionVariant }
  | { type: 'link'; label: string; href: string; external?: boolean; variant?: HomeflowActionVariant };

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
  location: { lat: number; lng: number };
  badges: string[];
  workingDays: number[];
  timeWindows: { start: string; end: string }[];
  baseQuote: { low: number; high: number };
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
  pro: { id: string; name?: string; image?: string };
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
  map?: { center: [number, number]; markers: HomeflowMapMarker[]; selectedId?: string };
  pro?: HomeflowProSummary & { recentReviews?: HomeflowReview[] };
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

const DEFAULT_ADDRESS: HomeflowAddress = {
  label: 'Home',
  line1: 'Residensi 22, Jalan Kiara',
  line2: 'Mont Kiara',
  city: 'Kuala Lumpur',
  state: 'Wilayah Persekutuan',
  postal_code: '50480',
  country: 'MY',
  notes: 'Guardhouse: HomeFlow',
};

const DEFAULT_CUSTOMER_LOCATION: HomeflowLocation = { lat: 3.139, lng: 101.686, radiusKm: 15 };
const HOMEFLOW_TEMPLATE_PATHS = [
  path.resolve(process.cwd(), '..', 'client', 'dist', 'homeflow.html'),
  path.resolve(process.cwd(), 'client', 'dist', 'homeflow.html'),
  path.resolve(__dirname, '..', '..', '..', 'client', 'dist', 'homeflow.html'),
];
const API_BASE_ENV_KEYS = [
  'HOMEFLOW_API_BASE',
  'HOMEFLOW_API_BASE_URL',
  'HOMEFLOW_PUBLIC_API_BASE',
  'API_BASE_URL',
  'PUBLIC_API_URL',
  'APP_URL',
  'BASE_URL',
];

const sanitizeBaseUrl = (value: string): string => value.replace(/\/+$/, '');

const resolveHomeflowApiBase = (): string => {
  for (const key of API_BASE_ENV_KEYS) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) {
      return sanitizeBaseUrl(value.trim());
    }
  }
  const port = typeof process.env.PORT === 'string' && process.env.PORT.trim() ? process.env.PORT.trim() : '3000';
  return `http://localhost:${port}`;
};

const toRadians = (value: number) => (value * Math.PI) / 180;
const EARTH_RADIUS_KM = 6371;
const HOMEFLOW_TIMEZONE_OFFSET_MINUTES = 8 * 60;

function haversineDistance(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

const formatDateTime = (date: Date) => {
  const adjusted = new Date(date.getTime() + HOMEFLOW_TIMEZONE_OFFSET_MINUTES * 60 * 1000);
  const iso = adjusted.toISOString();
  return `${iso.slice(0, 19)}+08:00`;
};

const formatDate = (date: Date) => {
  const adjusted = new Date(date.getTime() + HOMEFLOW_TIMEZONE_OFFSET_MINUTES * 60 * 1000);
  return adjusted.toISOString().slice(0, 10);
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const TOOL_DEFINITIONS: Tool[] = [
  {
    name: 'my_reviews',
    description: 'View your past job reviews and ratings.',
    inputSchema: {
      type: 'object',
      properties: {
        since: { type: 'string', format: 'date' },
      },
      additionalProperties: false,
    },
    _meta: HOMEFLOW_WIDGET_META,
  },
  {
    name: 'homeflow_home',
    title: 'HandyHub by HomeFlow',
    description: 'Open the HomeFlow launcher with quick actions and featured pros.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    _meta: HOMEFLOW_WIDGET_META,
  },
  {
    name: 'google-account',
    description: 'Fetch the connected Google account profile information.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    _meta: HOMEFLOW_WIDGET_META,
  },
  {
    name: 'search_pros',
    description: 'Find nearby providers for a given home service, date window, and budget.',
    inputSchema: {
      type: 'object',
      properties: {
        service: { type: 'string', enum: [...HOMEFLOW_SERVICES] },
        when: {
          type: 'object',
          properties: {
            date: { type: 'string', format: 'date' },
            flex: { type: 'string' },
          },
          required: ['date'],
        },
        location: {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' },
            radius_km: { type: 'number', default: 10 },
          },
          required: ['lat', 'lng'],
        },
        filters: {
          type: 'object',
          properties: {
            price_max: { type: 'number' },
            rating_min: { type: 'number' },
            only_vetted: { type: 'boolean', default: true },
          },
        },
      },
      required: ['service', 'when', 'location'],
    },
    _meta: HOMEFLOW_WIDGET_META,
  },
  {
    name: 'get_slots',
    description: 'Fetch real-time availability slots for a provider across a date range.',
    inputSchema: {
      type: 'object',
      properties: {
        pro_id: { type: 'string' },
        date_range: {
          type: 'object',
          properties: {
            start: { type: 'string', format: 'date' },
            end: { type: 'string', format: 'date' },
          },
          required: ['start', 'end'],
        },
      },
      required: ['pro_id', 'date_range'],
    },
    _meta: HOMEFLOW_WIDGET_META,
  },
  {
    name: 'get_quote',
    description: 'Calculate an estimated quote for a service with optional provider match.',
    inputSchema: {
      type: 'object',
      properties: {
        service: { type: 'string', enum: [...HOMEFLOW_SERVICES] },
        pro_id: { type: 'string' },
        details: { type: 'object' },
      },
      required: ['service'],
    },
    _meta: HOMEFLOW_WIDGET_META,
  },
  {
    name: 'book_job',
    description: 'Confirm a booking with the selected provider and slot.',
    inputSchema: {
      type: 'object',
      properties: {
        pro_id: { type: 'string' },
        service: { type: 'string', enum: [...HOMEFLOW_SERVICES] },
        slot: {
          type: 'object',
          properties: {
            start: { type: 'string', format: 'date-time' },
            end: { type: 'string', format: 'date-time' },
          },
          required: ['start', 'end'],
        },
        quote_id: { type: 'string' },
        price_estimate: { type: 'number' },
        address: { type: 'object' },
        instructions: { type: 'string' },
      },
      required: ['pro_id', 'service', 'slot'],
    },
    _meta: HOMEFLOW_WIDGET_META,
  },
  {
    name: 'update_job',
    description: 'Reschedule or edit instructions for an existing booking.',
    inputSchema: {
      type: 'object',
      properties: {
        job_id: { type: 'string' },
        slot: {
          type: 'object',
          properties: {
            start: { type: 'string', format: 'date-time' },
            end: { type: 'string', format: 'date-time' },
          },
        },
        instructions: { type: 'string' },
      },
      required: ['job_id'],
    },
    _meta: HOMEFLOW_WIDGET_META,
  },
  {
    name: 'complete_job',
    description: 'Mark a booking as completed.',
    inputSchema: {
      type: 'object',
      properties: {
        job_id: { type: 'string' },
      },
      required: ['job_id'],
    },
    _meta: HOMEFLOW_WIDGET_META,
  },
  {
    name: 'cancel_job',
    description: 'Cancel a scheduled booking.',
    inputSchema: {
      type: 'object',
      properties: {
        job_id: { type: 'string' },
        reason: { type: 'string' },
      },
      required: ['job_id'],
    },
    _meta: HOMEFLOW_WIDGET_META,
  },
  {
    name: 'job_status',
    description: 'Retrieve the status of a booking or list upcoming jobs.',
    inputSchema: {
      type: 'object',
      properties: {
        job_id: { type: 'string' },
      },
    },
    _meta: HOMEFLOW_WIDGET_META,
  },
  {
    name: 'rate_job_form',
    description: 'Open a rating form for a completed job.',
    inputSchema: {
      type: 'object',
      properties: {
        job_id: { type: 'string' },
      },
      required: ['job_id'],
    },
    _meta: HOMEFLOW_WIDGET_META,
  },
  {
    name: 'rate_job',
    description: 'Submit a rating and optional review for a completed job.',
    inputSchema: {
      type: 'object',
      properties: {
        job_id: { type: 'string' },
        rating: { type: 'number', minimum: 1, maximum: 5 },
        review: { type: 'string', maxLength: 280 },
      },
      required: ['job_id', 'rating'],
    },
    _meta: HOMEFLOW_WIDGET_META,
  },
  {
    name: 'pro_reviews',
    description: 'Surface recent reviews for a provider.',
    inputSchema: {
      type: 'object',
      properties: {
        pro_id: { type: 'string' },
      },
      required: ['pro_id'],
    },
    _meta: HOMEFLOW_WIDGET_META,
  },
];

async function readTemplate(): Promise<string> {
  for (const candidate of HOMEFLOW_TEMPLATE_PATHS) {
    try {
      const html = await readFile(candidate, 'utf8');
      return html;
    } catch (error) {
      // continue search
    }
  }
  return '<!doctype html><html><body><p>HomeFlow UI unavailable.</p></body></html>';
}

function injectConfigIntoTemplate(html: string, config: HomeflowUiConfig): string {
  const json = JSON.stringify(config);
  const escaped = json.replace(/"/g, '&quot;');
  return html.replace(HOMEFLOW_TEMPLATE_PLACEHOLDER, escaped);
}

function ensureServiceSlug(service: unknown): HomeflowServiceName {
  if (typeof service !== 'string') {
    throw new Error('Service is required.');
  }
  if (HOMEFLOW_SERVICES.includes(service as HomeflowServiceName)) {
    return service as HomeflowServiceName;
  }
  throw new Error('Unsupported service.');
}

function parseLocation(value: unknown): HomeflowLocation {
  if (!value || typeof value !== 'object') {
    throw new Error('Location is required.');
  }
  const loc = value as Record<string, unknown>;
  const lat = Number(loc.lat);
  const lng = Number(loc.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('Location coordinates are invalid.');
  }
  const radius = Number(loc.radius_km);
  return { lat, lng, radiusKm: Number.isFinite(radius) ? radius : 10 };
}


function toHomeflowProSummary(pro: Pro & { service: Service; badges: ProBadge[]; extras: ProExtra[]; timeWindows: ProTimeWindow[] }): HomeflowProSummary {
  return {
    id: pro.slug,
    service: pro.service.slug as HomeflowServiceName,
    name: pro.name,
    image: pro.image,
    imageAlt: pro.imageAlt,
    rating: pro.rating,
    reviews: pro.reviewsCount,
    priceFrom: pro.priceFrom,
    currency: pro.currency,
    location: { lat: pro.latitude, lng: pro.longitude },
    badges: pro.badges.map((badge) => badge.label),
    workingDays: pro.workingDays,
    timeWindows: pro.timeWindows.map((window) => ({ start: window.start, end: window.end })),
    baseQuote: { low: pro.baseQuoteLow, high: pro.baseQuoteHigh },
    extrasPricing: Object.fromEntries(pro.extras.map((extra) => [extra.name, extra.price])),
    serviceRadiusKm: pro.serviceRadiusKm,
  };
}

function toHomeflowJobCard(booking: Booking & { service: Service; pro: Pro; quote: Quote | null }): HomeflowJobCard {
  return {
    jobId: booking.id.toString(),
    service: booking.service.slug as HomeflowServiceName,
    status: booking.status,
    pro: {
      id: booking.pro.slug,
      name: booking.pro.name,
      image: booking.pro.image,
    },
    slot: { start: formatDateTime(new Date(booking.start)), end: formatDateTime(new Date(booking.end)) },
    currency: booking.pro.currency,
    priceEstimate: booking.priceEstimate,
    instructions: booking.instructions ?? undefined,
    quoteId: booking.quoteId ?? undefined,
    rating: booking.rating ?? undefined,
    review: booking.reviewText ?? undefined,
    actions: buildJobActions(booking),
  };
}

function toHomeflowQuote(quote: Quote & { service: Service; pro: Pro | null }): HomeflowQuoteConfig {
  return {
    quoteId: quote.id,
    service: quote.service.slug as HomeflowServiceName,
    currency: quote.currency,
    estimateLow: quote.estimateLow,
    estimateHigh: quote.estimateHigh,
    expiresAt: formatDateTime(new Date(quote.expiresAt)),
    proId: quote.pro ? quote.pro.slug : undefined,
  };
}

export class HomeflowMcpAdapter {
  private readonly templatePromise = readTemplate();
  private readonly apiBase: string;
  private accountContext?: HomeflowAccountContext;

  constructor(private readonly prisma: PrismaClient) {
    this.apiBase = resolveHomeflowApiBase();
  }

  async listResources(): Promise<Resource[]> {
    return [
      {
        uri: HOMEFLOW_TEMPLATE_URI,
        name: 'HomeFlow UI',
        description: 'Interactive HomeFlow cards',
        mimeType: 'text/html+skybridge',
        _meta: HOMEFLOW_WIDGET_META,
      },
    ];
  }

  async listResourceTemplates(): Promise<ResourceTemplate[]> {
    return [
      {
        uriTemplate: HOMEFLOW_TEMPLATE_URI,
        name: 'HomeFlow UI Template',
        description: 'HomeFlow widget template',
        mimeType: 'text/html+skybridge',
        _meta: HOMEFLOW_WIDGET_META,
      },
    ];
  }

  async listTools(): Promise<Tool[]> {
    return TOOL_DEFINITIONS;
  }

  setAccountContext(context: HomeflowAccountContext | undefined): void {
    this.accountContext = context ? { ...context } : undefined;
  }

  async readResource(): Promise<{ html: string; config: HomeflowUiConfig }> {
    const config = this.enrichConfig(await this.buildHomeConfig());
    const html = injectConfigIntoTemplate(await this.templatePromise, config);
    return { html, config };
  }

  async handleTool(name: string, args: unknown): Promise<CallToolResult> {
    switch (name) {
      case 'homeflow_home':
        return this.handleHome(args);
      case 'search_pros':
        return this.handleSearchPros(args);
      case 'get_slots':
        return this.handleGetSlots(args);
      case 'get_quote':
        return this.handleGetQuote(args);
      case 'book_job':
        return this.handleBookJob(args);
      case 'update_job':
        return this.handleUpdateJob(args);
      case 'complete_job':
        return this.handleCompleteJob(args);
      case 'cancel_job':
        return this.handleCancelJob(args);
      case 'job_status':
        return this.handleJobStatus(args);
      case 'rate_job_form':
        return this.handleRateJobForm(args);
      case 'rate_job':
        return this.handleRateJob(args);
      case 'pro_reviews':
        return this.handleProReviews(args);
      case 'google-account':
        return this.handleGoogleAccount(args);
      default:
        throw new Error(`Unknown HomeFlow tool: ${name}`);
    }
  }

  private async handleHome(_args: unknown): Promise<CallToolResult> {
    const config = await this.buildHomeConfig();
    config.context = { ...(config.context ?? {}), view: 'home' };
    const payload = { featured: config.pros?.map((pro) => ({ id: pro.id, name: pro.name, rating: pro.rating })) ?? [] };
    const summary = config.pros && config.pros.length > 0 ? `Featured ${config.pros.length} pros.` : 'Showing HomeFlow launcher.';
    return await this.buildCallResult(summary, config, payload);
  }

  private async buildHomeConfig(): Promise<HomeflowUiConfig> {
    const now = new Date();
    const today = formatDate(now);
    const pros = await this.prisma.pro.findMany({
      include: {
        service: true,
        badges: true,
        extras: true,
        timeWindows: true,
      },
      orderBy: { rating: 'desc' },
      take: 8,
    });

    const decorated = pros
      .map((pro) => {
        const summary = toHomeflowProSummary(pro);
        const next = computeNextAvailableSlot(summary, now);
        const distance = haversineDistance(DEFAULT_CUSTOMER_LOCATION, summary.location);
        return {
          ...summary,
          distanceKm: Math.round(distance * 10) / 10,
          nextAvailable: next?.start,
          actions: buildProActions(summary, today),
        };
      })
      .sort((a, b) => {
        const ratingA = typeof a.rating === 'number' ? a.rating : 0;
        const ratingB = typeof b.rating === 'number' ? b.rating : 0;
        if (ratingB !== ratingA) {
          return ratingB - ratingA;
        }
        const priceA = typeof a.priceFrom === 'number' ? a.priceFrom : Number.MAX_SAFE_INTEGER;
        const priceB = typeof b.priceFrom === 'number' ? b.priceFrom : Number.MAX_SAFE_INTEGER;
        return priceA - priceB;
      })
      .slice(0, 4);

    const mapMarkers = decorated
      .map(toMapMarker)
      .filter((marker): marker is HomeflowMapMarker => Boolean(marker));

    const quickActions: HomeflowAction[] = [
      {
        type: 'tool',
        label: 'Find a cleaner',
        tool: 'search_pros',
        params: {
          service: 'cleaning',
          when: { date: today, flex: 'morning' },
          location: { lat: DEFAULT_CUSTOMER_LOCATION.lat, lng: DEFAULT_CUSTOMER_LOCATION.lng, radius_km: DEFAULT_CUSTOMER_LOCATION.radiusKm },
        },
        variant: 'primary',
      },
      {
        type: 'tool',
        label: 'Book a plumber',
        tool: 'search_pros',
        params: {
          service: 'plumbing',
          when: { date: today, flex: 'evening' },
          location: { lat: DEFAULT_CUSTOMER_LOCATION.lat, lng: DEFAULT_CUSTOMER_LOCATION.lng, radius_km: DEFAULT_CUSTOMER_LOCATION.radiusKm },
        },
        variant: 'secondary',
      },
      {
        type: 'tool',
        label: 'Ask about pricing',
        tool: 'get_quote',
        params: { service: 'moving' },
        variant: 'ghost',
      },
    ];

    const pricingActions: HomeflowAction[] = [
      { type: 'tool', label: 'Cleaner pricing', tool: 'get_quote', params: { service: 'cleaning' }, variant: 'ghost' },
      { type: 'tool', label: 'Plumber pricing', tool: 'get_quote', params: { service: 'plumbing' }, variant: 'ghost' },
      { type: 'tool', label: 'AC service pricing', tool: 'get_quote', params: { service: 'ac_service' }, variant: 'ghost' },
    ];

    const manageActions: HomeflowAction[] = [
      { type: 'tool', label: 'Manage bookings', tool: 'job_status', variant: 'secondary' },
      { type: 'tool', label: 'Reviews', tool: 'my_reviews', variant: 'ghost' },
    ];

    return {
      view: 'home',
      title: 'HandyHub by HomeFlow',
      subtitle: 'Book trusted pros in under 2 minutes.',
      description: 'Compare real-time availability, upfront pricing, and vetted ratings without leaving chat.',
      timestamp: formatDateTime(now),
      quickActions,
      pricingActions,
      manageActions,
      viewModes: ['carousel', 'list', 'map'],
      defaultView: 'carousel',
      map: mapMarkers.length
        ? {
            center: mapMarkers[0].coords,
            markers: mapMarkers,
            selectedId: mapMarkers[0].id,
          }
        : undefined,
      pros: decorated,
      context: {
        default_location: DEFAULT_CUSTOMER_LOCATION,
        default_date: today,
      },
    };
  }

  private async handleSearchPros(rawArgs: unknown): Promise<CallToolResult> {
    if (!rawArgs || typeof rawArgs !== 'object') {
      throw new Error('Missing search parameters.');
    }
    const args = rawArgs as Record<string, unknown>;
    const service = ensureServiceSlug(args.service);
    const location = parseLocation(args.location);
    const filters = args.filters && typeof args.filters === 'object' ? (args.filters as Record<string, unknown>) : {};
    const priceMax = Number(filters.price_max);
    const ratingMin = Number(filters.rating_min);

    const when = args.when && typeof args.when === 'object' ? (args.when as Record<string, unknown>) : {};
    const whenDate = typeof when.date === 'string' ? when.date : formatDate(new Date());
    let baseDate = new Date(`${whenDate}T00:00:00Z`);
    if (Number.isNaN(baseDate.getTime())) {
      baseDate = new Date();
    }

    const pros = await this.prisma.pro.findMany({
      where: { service: { slug: service } },
      include: {
        service: true,
        badges: true,
        extras: true,
        timeWindows: true,
      },
    });
    const decorated = pros
      .map((pro) => {
        const summary = toHomeflowProSummary(pro);
        const distance = haversineDistance(location, summary.location);
        const next = computeNextAvailableSlot(summary, baseDate);
        return {
          ...summary,
          distanceKm: Math.round(distance * 10) / 10,
          nextAvailable: next?.start,
          actions: buildProActions(summary, whenDate),
        };
      })
      .sort((a, b) => {
        if (typeof a.rating === 'number' && typeof b.rating === 'number' && b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        return (a.distanceKm ?? Number.MAX_SAFE_INTEGER) - (b.distanceKm ?? Number.MAX_SAFE_INTEGER);
      });

    let summaries = decorated.filter((summary) => {
      if ((summary.distanceKm ?? Number.MAX_SAFE_INTEGER) > summary.serviceRadiusKm) {
        return false;
      }
      if (Number.isFinite(priceMax) && !Number.isNaN(priceMax) && typeof summary.priceFrom === 'number' && summary.priceFrom > priceMax) {
        return false;
      }
      if (Number.isFinite(ratingMin) && !Number.isNaN(ratingMin) && typeof summary.rating === 'number' && summary.rating < ratingMin) {
        return false;
      }
      return true;
    });

    let fallbackApplied = false;
    if (!summaries.length && decorated.length) {
      summaries = decorated.slice(0, 4);
      fallbackApplied = true;
    }

    const mapMarkers = summaries
      .map(toMapMarker)
      .filter((marker): marker is HomeflowMapMarker => Boolean(marker));

    const config: HomeflowUiConfig = {
      view: 'search',
      title: `${service.replace('_', ' ')} nearby`,
      subtitle: summaries.length
        ? fallbackApplied
          ? `${summaries.length} top-rated providers shown`
          : `${summaries.length} available near you`
        : 'No providers match the filters',
      timestamp: formatDateTime(new Date()),
      pros: summaries,
      viewModes: ['carousel', 'list', 'map'],
      defaultView: 'carousel',
      map: mapMarkers.length
        ? {
            center: mapMarkers[0].coords,
            markers: mapMarkers,
            selectedId: mapMarkers[0].id,
          }
        : undefined,
      emptyState: `No ${service.replace('_', ' ')} pros for ${whenDate}.`,
      query: {
        service,
        date: whenDate,
        location,
        filters,
      },
      context: {
        service,
        location,
        filters,
        fallback: fallbackApplied || undefined,
        previousView: 'home',
      },
      notifications: fallbackApplied
        ? [
            'Showing top-rated providers across the network because none were nearby.',
          ]
        : undefined,
    };

    const payload = {
      service,
      pros: summaries.map((pro) => ({
        id: pro.id,
        rating: pro.rating,
        price_from: pro.priceFrom,
        distance_km: pro.distanceKm,
      })),
      fallback: fallbackApplied,
    };
    let summaryText: string;
    if (!summaries.length) {
      summaryText = `No ${service} pros matched.`;
    } else if (fallbackApplied) {
      summaryText = `Showing ${summaries.length} top-rated ${service.replace('_', ' ')} providers.`;
    } else {
      summaryText = `Found ${summaries.length} ${service.replace('_', ' ')} providers.`;
    }
    return await this.buildCallResult(summaryText, config, payload);
  }

  private async handleGetSlots(rawArgs: unknown): Promise<CallToolResult> {
    if (!rawArgs || typeof rawArgs !== 'object') {
      throw new Error('Missing pro_id or date range.');
    }
    const args = rawArgs as Record<string, unknown>;
    const proSlug = typeof args.pro_id === 'string' && args.pro_id ? args.pro_id : undefined;
    if (!proSlug) throw new Error('pro_id is required.');
    const range = args.date_range && typeof args.date_range === 'object' ? (args.date_range as Record<string, unknown>) : {};
    const startDate = typeof range.start === 'string' ? range.start : formatDate(new Date());
    const endDate = typeof range.end === 'string' ? range.end : startDate;

    const pro = await this.prisma.pro.findFirst({
      where: { OR: [{ slug: proSlug }, { id: Number(proSlug) || -1 }] },
      include: {
        service: true,
        badges: true,
        extras: true,
        timeWindows: true,
      },
    });
    if (!pro) {
      throw new Error('Provider not found.');
    }
    const summary = toHomeflowProSummary(pro);
    const now = new Date();
    const startDateUtc = createDateOnly(startDate);
    const endDateUtc = createDateOnly(endDate);
    const dates = enumerateDates(startDateUtc, endDateUtc);
    const slots: HomeflowSlotOption[] = [];
    for (const date of dates) {
      for (const window of summary.timeWindows) {
        const day = createDateOnly(date);
        const slotStart = createLocalDateForTime(day, window.start);
        const slotEnd = createLocalDateForTime(day, window.end);
        if (slotEnd <= now) continue;
        const startIso = formatDateTime(slotStart);
        const endIso = formatDateTime(slotEnd);
        slots.push({
          start: startIso,
          end: endIso,
          label: `${window.start}–${window.end}`,
          primaryAction: {
            type: 'tool',
            label: 'Book',
            tool: 'book_job',
            params: { pro_id: summary.id, service: summary.service, slot: { start: startIso, end: endIso }, address: DEFAULT_ADDRESS },
            variant: 'primary',
          },
        });
      }
    }
    if (slots.length === 0) {
      const suggestion = addDaysString(endDate, 2);
      const config: HomeflowUiConfig = {
        view: 'slots',
        title: `Availability for ${summary.name}`,
        subtitle: `${startDate} to ${endDate}`,
        timestamp: formatDateTime(new Date()),
        pro: summary,
        notifications: ['No slots available for this range. Try widening your search window.'],
        context: { pro_id: summary.id, date_range: { start: startDate, end: endDate } },
      };
      return await this.buildCallResult(
        `No slots available for ${summary.name} between ${startDate} and ${endDate}.`,
        config,
        { pro_id: summary.id, slots: [] },
      );
    }

    const config: HomeflowUiConfig = {
      view: 'slots',
      title: `Availability for ${summary.name}`,
      subtitle: `${startDate} to ${endDate}`,
      timestamp: formatDateTime(new Date()),
      pro: summary,
      slots,
      context: { pro_id: summary.id, date_range: { start: startDate, end: endDate } },
    };

    const payload = {
      pro_id: summary.id,
      slots: slots.map((slot) => ({ start: slot.start, end: slot.end })),
      next_available: slots[0]?.start ?? null,
    };

    return await this.buildCallResult(`Listed ${slots.length} slots for ${summary.name}.`, config, payload);
  }

  private async handleGetQuote(rawArgs: unknown): Promise<CallToolResult> {
    if (!rawArgs || typeof rawArgs !== 'object') {
      throw new Error('Missing quote parameters.');
    }
    const args = rawArgs as Record<string, unknown>;
    const serviceSlug = ensureServiceSlug(args.service);
    const proSlug = typeof args.pro_id === 'string' ? args.pro_id : undefined;
    const details = typeof args.details === 'object' && args.details ? (args.details as Record<string, unknown>) : {};

    const service = await this.prisma.service.findFirst({ where: { slug: serviceSlug } });
    if (!service) {
      throw new Error('Service not found.');
    }

    let pro: (Pro & { service: Service } | null) = null;
    if (proSlug) {
      pro = await this.prisma.pro.findFirst({
        where: { OR: [{ slug: proSlug }, { id: Number(proSlug) || -1 }] },
        include: { service: true },
      });
      if (!pro) {
        throw new Error('Provider not found for quote.');
      }
      if (pro.service.slug !== serviceSlug) {
        throw new Error('Provider does not offer requested service.');
      }
    }

    const low = pro ? pro.baseQuoteLow : service.defaultPriceLow;
    const high = pro ? pro.baseQuoteHigh : service.defaultPriceHigh;
    const createdAt = new Date();
    const quoteRecord = await this.prisma.quote.create({
      data: {
        serviceId: service.id,
        proId: pro?.id,
        estimateLow: low,
        estimateHigh: high,
        currency: pro?.currency ?? 'MYR',
        expiresAt: addHours(createdAt, 6),
        suggestedDateStart: addDays(createdAt, 1),
        suggestedDateEnd: addDays(createdAt, 3),
        details: Object.keys(details).length ? (details as Prisma.JsonValue) : null,
      },
      include: { service: true, pro: true },
    });

    const quote = toHomeflowQuote(quoteRecord);
    quote.actions = [
      {
        type: 'tool',
        label: 'See slots',
        tool: 'get_slots',
        params: {
          pro_id: quote.proId ?? pro?.slug ?? '',
          date_range: {
            start: formatDate(quoteRecord.suggestedDateStart),
            end: formatDate(quoteRecord.suggestedDateEnd),
          },
        },
        variant: 'primary',
      },
    ];

    const config: HomeflowUiConfig = {
      view: 'quote',
      title: `Estimated price for ${service.title}`,
      subtitle: `${quote.currency} ${quote.estimateLow}–${quote.estimateHigh}`,
      timestamp: formatDateTime(createdAt),
      quote,
      context: {
        service: serviceSlug,
        quote_id: quote.quoteId,
        pro_id: quote.proId,
      },
    };

    const payload = {
      quote_id: quote.quoteId,
      estimate_low: quote.estimateLow,
      estimate_high: quote.estimateHigh,
      currency: quote.currency,
      pro_id: quote.proId,
    };
    return await this.buildCallResult(`Estimated ${quote.currency} ${quote.estimateLow}–${quote.estimateHigh}.`, config, payload);
  }

  private async handleBookJob(rawArgs: unknown): Promise<CallToolResult> {
    if (!rawArgs || typeof rawArgs !== 'object') {
      throw new Error('Missing booking payload.');
    }
    const args = rawArgs as Record<string, unknown>;
    const proSlug = typeof args.pro_id === 'string' ? args.pro_id : undefined;
    const serviceSlug = ensureServiceSlug(args.service);
    const slot = args.slot && typeof args.slot === 'object' ? (args.slot as Record<string, unknown>) : undefined;
    if (!slot || typeof slot.start !== 'string' || typeof slot.end !== 'string') {
      throw new Error('slot.start and slot.end are required.');
    }

    const pro = await this.prisma.pro.findFirst({
      where: { OR: [{ slug: proSlug }, { id: Number(proSlug) || -1 }] },
      include: { service: true },
    });
    if (!pro) throw new Error('Provider not found.');
    if (pro.service.slug !== serviceSlug) throw new Error('Provider does not offer this service.');

    const quoteId = typeof args.quote_id === 'string' ? args.quote_id : undefined;
    let quote: (Quote & { service: Service; pro: Pro | null }) | null = null;
    if (quoteId) {
      quote = await this.prisma.quote.findUnique({
        where: { id: quoteId },
        include: { service: true, pro: true },
      });
    }

    const priceEstimate = typeof args.price_estimate === 'number' ? args.price_estimate : pro.baseQuoteLow;
    const address = (args.address && typeof args.address === 'object' ? args.address : DEFAULT_ADDRESS) as HomeflowAddress;
    const instructions = typeof args.instructions === 'string' ? args.instructions : null;

    const booking = await this.prisma.booking.create({
      data: {
        proId: pro.id,
        serviceId: pro.serviceId,
        userId: null,
        quoteId: quote ? quote.id : null,
        start: new Date(slot.start),
        end: new Date(slot.end),
        status: 'confirmed',
        priceEstimate,
        address: address as Prisma.JsonValue,
        instructions,
      },
      include: {
        service: true,
        pro: true,
        quote: true,
      },
    });

    const cards = await this.loadJobCards();
    const config: HomeflowUiConfig = {
      view: 'booking',
      title: 'Booking confirmed',
      subtitle: `${booking.pro.name} on ${formatDate(new Date(booking.start))}`,
      timestamp: formatDateTime(new Date()),
      job: toHomeflowJobCard(booking),
      jobs: cards,
      context: {
        job_id: booking.id,
      },
      notifications: ['A confirmation email has been sent.'],
    };

    const payload = {
      job_id: booking.id.toString(),
      status: booking.status,
      pro_id: booking.pro.slug,
      service: serviceSlug,
      start: booking.start.toISOString(),
      end: booking.end.toISOString(),
    };

    return await this.buildCallResult(`Booked ${booking.pro.name} for ${formatDate(new Date(booking.start))}.`, config, payload);
  }

  private async handleUpdateJob(rawArgs: unknown): Promise<CallToolResult> {
    if (!rawArgs || typeof rawArgs !== 'object') throw new Error('Missing update payload.');
    const args = rawArgs as Record<string, unknown>;
    const jobId = typeof args.job_id === 'string' ? args.job_id : undefined;
    if (!jobId) throw new Error('job_id is required.');

    const updates: Record<string, unknown> = {};
    const slot = args.slot && typeof args.slot === 'object' ? (args.slot as Record<string, unknown>) : undefined;
    if (slot) {
      if (typeof slot.start === 'string') updates.start = new Date(slot.start);
      if (typeof slot.end === 'string') updates.end = new Date(slot.end);
    }
    if (typeof args.instructions === 'string') {
      updates.instructions = args.instructions;
    }

    const booking = await this.prisma.booking.update({
      where: { id: Number(jobId) },
      data: updates,
      include: { service: true, pro: true, quote: true },
    });

    const config: HomeflowUiConfig = {
      view: 'update',
      title: 'Booking updated',
      subtitle: `${booking.pro.name} • ${booking.status}`,
      timestamp: formatDateTime(new Date()),
      job: toHomeflowJobCard(booking),
      context: { job_id: booking.id },
    };

    const payload = {
      job_id: booking.id.toString(),
      status: booking.status,
      start: booking.start.toISOString(),
      end: booking.end.toISOString(),
    };
    return await this.buildCallResult(`Updated booking ${booking.id}.`, config, payload);
  }

  private async handleCompleteJob(rawArgs: unknown): Promise<CallToolResult> {
    if (!rawArgs || typeof rawArgs !== 'object') throw new Error('Missing payload.');
    const args = rawArgs as Record<string, unknown>;
    const jobId = typeof args.job_id === 'string' ? args.job_id : undefined;
    if (!jobId) throw new Error('job_id is required.');

    const booking = await this.prisma.booking.update({
      where: { id: Number(jobId) },
      data: { status: 'completed', updatedAt: new Date() },
      include: { service: true, pro: true, quote: true },
    });

    const config: HomeflowUiConfig = {
      view: 'booking',
      title: 'Job marked as completed',
      subtitle: booking.pro.name,
      timestamp: formatDateTime(new Date()),
      job: toHomeflowJobCard(booking),
      context: { job_id: booking.id },
    };

    const payload = { job_id: booking.id.toString(), status: booking.status };
    return await this.buildCallResult(`Completed job ${booking.id}.`, config, payload);
  }

  private async handleCancelJob(rawArgs: unknown): Promise<CallToolResult> {
    if (!rawArgs || typeof rawArgs !== 'object') throw new Error('Missing payload.');
    const args = rawArgs as Record<string, unknown>;
    const jobId = typeof args.job_id === 'string' ? args.job_id : undefined;
    if (!jobId) throw new Error('job_id is required.');
    const reason = typeof args.reason === 'string' ? args.reason : 'cancelled_via_mcp';

    const booking = await this.prisma.booking.update({
      where: { id: Number(jobId) },
      data: {
        status: 'cancelled',
        reviewText: reason,
        updatedAt: new Date(),
      },
      include: { service: true, pro: true, quote: true },
    });

    const config: HomeflowUiConfig = {
      view: 'cancelled',
      title: 'Booking cancelled',
      subtitle: booking.pro.name,
      timestamp: formatDateTime(new Date()),
      job: toHomeflowJobCard(booking),
      notifications: ['We7ve notified the provider.', `Reason: ${reason}`],
      context: { job_id: booking.id },
    };

    const payload = { job_id: booking.id.toString(), status: booking.status, reason };
    return await this.buildCallResult(`Cancelled job ${booking.id}.`, config, payload);
  }

  private async handleJobStatus(rawArgs: unknown): Promise<CallToolResult> {
    const jobId = rawArgs && typeof rawArgs === 'object' ? ((rawArgs as Record<string, unknown>).job_id as string | undefined) : undefined;
    if (jobId) {
      const booking = await this.prisma.booking.findUnique({
        where: { id: Number(jobId) },
        include: { service: true, pro: true, quote: true },
      });
      if (!booking) throw new Error('Job not found.');
      const card = toHomeflowJobCard(booking);
      const config: HomeflowUiConfig = {
        view: 'job_status',
        title: 'Booking status',
        subtitle: `${booking.pro.name} • ${booking.status}`,
        timestamp: formatDateTime(new Date()),
        jobs: [card],
        context: { job_id: booking.id },
      };
      const payload = { job_id: booking.id.toString(), status: booking.status };
      return await this.buildCallResult(`Status for ${booking.id}: ${booking.status}.`, config, payload);
    }

    const cards = await this.loadJobCards();
    const config: HomeflowUiConfig = {
      view: 'job_status',
      title: 'Upcoming jobs',
      subtitle: cards.length ? `Next booking ${formatDate(new Date(cards[0].slot.start))}` : 'No upcoming jobs',
      timestamp: formatDateTime(new Date()),
      jobs: cards,
      viewModes: cards.length ? ['list'] : undefined,
      context: { total: cards.length },
    };
    const payload = { total: cards.length };
    return await this.buildCallResult(`Found ${cards.length} upcoming job${cards.length === 1 ? '' : 's'}.`, config, payload);
  }

  private async handleRateJobForm(rawArgs: unknown): Promise<CallToolResult> {
    if (!rawArgs || typeof rawArgs !== 'object') throw new Error('Missing payload.');
    const args = rawArgs as Record<string, unknown>;
    if (typeof args.rating !== 'undefined' || typeof args.review !== 'undefined') {
      console.debug('[HomeflowMcpAdapter] rate_job_form received submission payload, delegating to rate_job:', args);
      return this.handleRateJob(rawArgs);
    }
    const jobId = typeof args.job_id === 'string' ? (args.job_id as string) : undefined;
    if (!jobId) throw new Error('job_id is required.');

    const booking = await this.prisma.booking.findUnique({
      where: { id: Number(jobId) },
      include: { service: true, pro: true, quote: true },
    });
    if (!booking) throw new Error('Job not found.');

    const jobCard = toHomeflowJobCard(booking);
    const config: HomeflowUiConfig = {
      view: 'rate_form',
      title: 'Leave a review',
      subtitle: `${booking.pro.name} — ${booking.service.title}`,
      timestamp: formatDateTime(new Date()),
      job: jobCard,
      reviewForm: {
        jobId: booking.id.toString(),
        proName: booking.pro.name,
        service: booking.service.title,
        rating: booking.rating ?? 5,
        review: booking.reviewText ?? null,
      },
      context: { job_id: booking.id },
    };

    const payload = { job_id: booking.id.toString(), job: jobCard };
    return await this.buildCallResult('Ready to collect feedback.', config, payload);
  }

  private async handleRateJob(rawArgs: unknown): Promise<CallToolResult> {
    if (!rawArgs || typeof rawArgs !== 'object') throw new Error('Missing payload.');
    console.debug('[HomeflowMcpAdapter] rate_job tool invoked with args:', rawArgs);
    const args = rawArgs as Record<string, unknown>;
    const jobIdSource = args.job_id;
    const ratingSource = args.rating;
    const parsedJobId =
      typeof jobIdSource === 'number'
        ? jobIdSource
        : typeof jobIdSource === 'string' && jobIdSource.trim()
          ? Number.parseInt(jobIdSource.trim(), 10)
          : Number.NaN;
    const parsedRating =
      typeof ratingSource === 'number'
        ? ratingSource
        : typeof ratingSource === 'string' && ratingSource.trim()
          ? Number.parseFloat(ratingSource.trim())
          : Number.NaN;
    if (!Number.isInteger(parsedJobId) || parsedJobId <= 0 || !Number.isFinite(parsedRating)) {
      throw new Error('job_id and rating are required.');
    }
    const rating = clamp(parsedRating, 1, 5);
    const reviewTextRaw = typeof args.review === 'string' ? args.review.trim() : '';
    const reviewText = reviewTextRaw.length ? reviewTextRaw : undefined;

    const booking = await this.prisma.booking.findUnique({
      where: { id: parsedJobId },
      include: { service: true, pro: true, quote: true },
    });
    if (!booking) throw new Error('Job not found.');

    const reviewRecord = await this.prisma.review.upsert({
      where: { bookingId: booking.id },
      create: {
        proId: booking.proId,
        bookingId: booking.id,
        userId: booking.userId ?? undefined,
        rating,
        review: reviewText ?? null,
      },
      update: {
        rating,
        review: reviewText ?? null,
        updatedAt: new Date(),
      },
    });

    const updatedBooking = await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'rated',
        rating,
        reviewText: reviewText ?? null,
        updatedAt: new Date(),
      },
      include: { service: true, pro: true, quote: true },
    });

    await this.refreshProRatings(updatedBooking.proId);

    const reviews = await this.prisma.review.findMany({
      where: { proId: updatedBooking.proId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const jobCard = toHomeflowJobCard(updatedBooking);
    const config: HomeflowUiConfig = {
      view: 'rate_job',
      title: 'Thanks for the feedback!',
      subtitle: `${rating.toFixed(1)}★ for ${updatedBooking.pro.name}`,
      timestamp: formatDateTime(new Date()),
      job: jobCard,
      reviews: reviews.map((item) => ({
        jobId: item.bookingId ? item.bookingId.toString() : 'n/a',
        rating: item.rating,
        review: item.review ?? undefined,
        updatedAt: formatDateTime(item.createdAt),
      })),
      context: { job_id: updatedBooking.id },
    };

    const payload = {
      job_id: updatedBooking.id.toString(),
      status: updatedBooking.status,
      rating,
      review: reviewText ?? null,
      review_id: reviewRecord.id,
    };
    return await this.buildCallResult(`Recorded ${rating}★ for ${booking.pro.name}.`, config, payload);
  }

  private async handleMyReviews(_args: unknown): Promise<CallToolResult> {
    const bookings = await this.prisma.booking.findMany({
      where: {
        status: { in: ['completed', 'rescheduled', 'cancelled', 'rated'] },
      },
      include: {
        service: true,
        pro: true,
        quote: true,
        review: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    if (!bookings.length) {
      const config: HomeflowUiConfig = {
        view: 'job_status',
        title: 'Your reviews',
        subtitle: 'No reviews yet.',
        timestamp: formatDateTime(new Date()),
        jobs: [],
        context: {},
        notifications: ['Leave feedback after your next booking to see it here.'],
      };
      return await this.buildCallResult('No reviews found.', config, { reviews: [] });
    }

    const cards = bookings.map((booking) => toHomeflowJobCard(booking));

    const config: HomeflowUiConfig = {
      view: 'job_status',
      title: 'Your reviews',
      subtitle: `${cards.length} past booking${cards.length === 1 ? '' : 's'} with ratings`,
      timestamp: formatDateTime(new Date()),
      jobs: cards,
      context: { filter: 'reviews' },
    };

    const payload = {
      reviews: cards.map((card) => ({ job_id: card.jobId, rating: card.rating ?? null, review: card.review ?? null })),
    };
    return await this.buildCallResult(`Showing ${cards.length} reviewed booking${cards.length === 1 ? '' : 's'}.`, config, payload);
  }

  private async handleProReviews(rawArgs: unknown): Promise<CallToolResult> {
    if (!rawArgs || typeof rawArgs !== 'object') throw new Error('Missing payload.');
    const proId = typeof (rawArgs as Record<string, unknown>).pro_id === 'string' ? ((rawArgs as Record<string, unknown>).pro_id as string) : undefined;
    if (!proId) throw new Error('pro_id is required.');

    const pro = await this.prisma.pro.findFirst({
      where: { OR: [{ slug: proId }, { id: Number(proId) || -1 }] },
      include: {
        service: true,
        badges: true,
        extras: true,
        timeWindows: true,
      },
    });
    if (!pro) throw new Error('Provider not found.');

    const reviews = await this.prisma.review.findMany({
      where: { proId: pro.id },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });

    const config: HomeflowUiConfig = {
      view: 'pro_reviews',
      title: `${pro.name} reviews`,
      subtitle: reviews.length ? `${reviews.length} recent` : 'No reviews yet',
      timestamp: formatDateTime(new Date()),
      pro: toHomeflowProSummary(pro),
      reviews: reviews.map((item) => ({
        jobId: item.bookingId ? item.bookingId.toString() : 'n/a',
        rating: item.rating,
        review: item.review ?? undefined,
        updatedAt: formatDateTime(item.createdAt),
      })),
      context: { pro_id: pro.slug },
    };

    const payload = {
      pro_id: pro.slug,
      review_count: reviews.length,
    };
    return await this.buildCallResult(`Loaded ${reviews.length} review${reviews.length === 1 ? '' : 's'} for ${pro.name}.`, config, payload);
  }

  private async handleGoogleAccount(_rawArgs: unknown): Promise<CallToolResult> {
    const account = this.accountContext;
    const baseConfig = await this.buildHomeConfig();
    const config: HomeflowUiConfig = {
      ...baseConfig,
      view: 'account',
      title: 'Your Google account',
      subtitle: account?.email ?? baseConfig.subtitle,
    };
    const summary = account?.email
      ? `Google account synced for ${account.email}.`
      : 'Google account details unavailable.';
    const payload: Record<string, unknown> = {
      account: account ?? null,
    };
    return await this.buildCallResult(summary, config, payload);
  }

  private async loadJobCards(): Promise<HomeflowJobCard[]> {
    const bookings = await this.prisma.booking.findMany({
      orderBy: { start: 'asc' },
      include: { service: true, pro: true, quote: true },
      take: 20,
    });
    return bookings.map(toHomeflowJobCard);
  }

  private async refreshProRatings(proId: number): Promise<void> {
    const stats = await this.prisma.review.groupBy({
      by: ['proId'],
      where: { proId },
      _count: { _all: true },
      _avg: { rating: true },
    });
    if (!stats.length) return;
    const { _count, _avg } = stats[0];
    await this.prisma.pro.update({
      where: { id: proId },
      data: {
        reviewsCount: _count._all,
        rating: _avg.rating ?? 0,
      },
    });
  }

  private enrichConfig(config: HomeflowUiConfig): HomeflowUiConfig {
    const context = { ...(config.context ?? {}) };
    if (this.apiBase && !context.apiBase) {
      context.apiBase = this.apiBase;
    }
    if (this.accountContext) {
      context.account = { ...this.accountContext };
    } else if (context.account) {
      delete context.account;
    }
    return { ...config, context };
  }

  private async buildCallResult(
    summary: string,
    config: HomeflowUiConfig,
    payload: Record<string, unknown>,
  ): Promise<CallToolResult> {
    const enrichedConfig = this.enrichConfig(config);
    const meta = { ...HOMEFLOW_WIDGET_META, widgetData: enrichedConfig };
    const template = await this.templatePromise;
    const html = injectConfigIntoTemplate(template, enrichedConfig);
    const resource = {
      type: 'resource' as const,
      resource: {
        uri: HOMEFLOW_TEMPLATE_URI,
        mimeType: 'text/html+skybridge',
        text: html,
        _meta: meta,
      },
    };
    console.debug('[HomeflowMcpAdapter] buildCallResult', {
      view: enrichedConfig.view,
      context: enrichedConfig.context,
    });
    return {
      content: [resource, { type: 'text', text: summary }],
      structuredContent: { ...payload, widgetData: enrichedConfig },
      _meta: meta,
      toolResult: {
        content: [resource, { type: 'text', text: summary }],
        structuredContent: { ...payload, widgetData: enrichedConfig },
        _meta: meta,
      },
    };
  }
}

function buildJobActions(booking: Booking & { service: Service; pro: Pro; quote: Quote | null }): HomeflowAction[] {
  const status = booking.status.toLowerCase();
  const actions: HomeflowAction[] = [];
  const jobId = booking.id.toString();
  const activeStatuses = new Set(['pending', 'confirmed', 'in_progress']);

  if (activeStatuses.has(status)) {
    actions.push({
      type: 'tool',
      label: 'Reschedule',
      tool: 'update_job',
      params: { job_id: jobId },
      variant: 'secondary',
    });
    actions.push({
      type: 'tool',
      label: 'Complete job',
      tool: 'complete_job',
      params: { job_id: jobId },
      variant: 'ghost',
    });
    actions.push({
      type: 'tool',
      label: 'Cancel job',
      tool: 'cancel_job',
      params: { job_id: jobId },
      variant: 'danger',
    });
  }

  const reviewEligible = ['completed', 'cancelled', 'rescheduled', 'rated'].includes(status);
  if (reviewEligible) {
    if (booking.rating && status === 'rated') {
      actions.push({
        type: 'tool',
        label: 'Update review',
        tool: 'rate_job_form',
        params: { job_id: jobId },
        variant: 'secondary',
      });
    } else {
      actions.push({
        type: 'tool',
        label: 'Leave review',
        tool: 'rate_job_form',
        params: { job_id: jobId },
        variant: 'primary',
      });
    }
  }

  return actions;
}

function toMapMarker(summary: HomeflowProSummary): HomeflowMapMarker | undefined {
  if (!summary.location) return undefined;
  return {
    id: summary.id,
    name: summary.name,
    coords: [summary.location.lng, summary.location.lat],
    rating: summary.rating ?? undefined,
    priceFrom: summary.priceFrom,
    currency: summary.currency,
    badges: summary.badges,
    actions: summary.actions,
  };
}

function buildProActions(summary: HomeflowProSummary, defaultDate: string): HomeflowAction[] {
  return [
    {
      type: 'tool',
      label: 'See slots',
      tool: 'get_slots',
      params: { pro_id: summary.id, date_range: { start: defaultDate, end: defaultDate } },
      variant: 'primary',
    },
    {
      type: 'tool',
      label: 'Get quote',
      tool: 'get_quote',
      params: { service: summary.service, pro_id: summary.id },
      variant: 'secondary',
    },
    {
      type: 'tool',
      label: 'Reviews',
      tool: 'pro_reviews',
      params: { pro_id: summary.id },
      variant: 'ghost',
    },
  ];
}

function computeNextAvailableSlot(summary: HomeflowProSummary, startDate: Date): HomeflowSlot | undefined {
  if (!summary.timeWindows.length) return undefined;
  const windows = [...summary.timeWindows].sort((a, b) => a.start.localeCompare(b.start));
  const workingDays = new Set(summary.workingDays);
  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0, 0);
  const now = new Date();

  for (let i = 0; i < 14; i += 1) {
    const day = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const weekday = day.getUTCDay();
    if (!workingDays.has(weekday)) continue;

    for (const window of windows) {
      const slotStart = createLocalDateForTime(day, window.start);
      const slotEnd = createLocalDateForTime(day, window.end);
      if (slotEnd <= now) continue;
      return { start: formatDateTime(slotStart), end: formatDateTime(slotEnd) };
    }
  }
  return undefined;
}

function getLocalToUtcOffsetMinutes(): number {
  const now = new Date();
  return now.getTimezoneOffset() - HOMEFLOW_TIMEZONE_OFFSET_MINUTES;
}
function createLocalDateForTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map((value) => Number.parseInt(value ?? '0', 10) || 0);
  const offsetMinutes = getLocalToUtcOffsetMinutes();
  const utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hours - HOMEFLOW_TIMEZONE_OFFSET_MINUTES / 60, minutes);
  return new Date(utc - offsetMinutes * 60 * 1000);
}

function enumerateDates(start: Date, end: Date): string[] {
  const dates: string[] = [];
  const cursor = createDateOnly(start);
  const limit = createDateOnly(end);
  while (cursor <= limit) {
    dates.push(formatDate(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function addDays(date: Date, days: number): Date {
  const d = createDateOnly(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function addHours(date: Date, hours: number): Date {
  const d = new Date(date);
  d.setUTCHours(d.getUTCHours() + hours);
  return d;
}

function addDaysString(dateStr: string, days: number): string {
  if (!DATE_ONLY_REGEX.test(dateStr)) return dateStr;
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDate(date);
}

function createDateOnly(input: string | Date): Date {
  if (input instanceof Date) {
    const d = new Date(input);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }
  if (typeof input === 'string' && DATE_ONLY_REGEX.test(input)) {
    return new Date(`${input}T00:00:00Z`);
  }
  const parsed = new Date(input);
  parsed.setUTCHours(0, 0, 0, 0);
  return parsed;
}
