#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(withAccelerate());

const DEFAULT_ADDRESS = {
  label: 'Home',
  line1: 'Residensi 22, Jalan Kiara',
  line2: 'Mont Kiara',
  city: 'Kuala Lumpur',
  state: 'Wilayah Persekutuan',
  postal_code: '50480',
  country: 'MY',
  notes: 'Guardhouse: HomeFlow',
};

const services = [
  {
    slug: 'cleaning',
    title: 'Cleaning',
    description: 'Keep homes tidy with vetted cleaners.',
    defaultPriceLow: 110,
    defaultPriceHigh: 180,
    defaultRadiusKm: 20,
    defaultWorkingDays: [1, 2, 3, 4, 5, 6],
    extras: [
      { name: 'deep_clean', price: 90 },
      { name: 'windows', price: 45 },
      { name: 'laundry', price: 50 },
    ],
  },
  {
    slug: 'plumbing',
    title: 'Plumbing',
    description: 'Fix leaks and pipes with pros.',
    defaultPriceLow: 170,
    defaultPriceHigh: 290,
    defaultRadiusKm: 22,
    defaultWorkingDays: [0, 1, 2, 3, 4, 5, 6],
    extras: [
      { name: 'emergency', price: 140 },
      { name: 'fixture_install', price: 95 },
    ],
  },
  {
    slug: 'electrical',
    title: 'Electrical',
    description: 'Licensed electricians on demand.',
    defaultPriceLow: 160,
    defaultPriceHigh: 260,
    defaultRadiusKm: 25,
    defaultWorkingDays: [1, 2, 3, 4, 5, 6],
    extras: [
      { name: 'ceiling_fan', price: 75 },
      { name: 'rewiring', price: 180 },
      { name: 'ev_charger', price: 220 },
    ],
  },
  {
    slug: 'handyman',
    title: 'Handyman',
    description: 'Repairs and installations made easy.',
    defaultPriceLow: 150,
    defaultPriceHigh: 240,
    defaultRadiusKm: 24,
    defaultWorkingDays: [1, 2, 3, 4, 5, 6],
    extras: [
      { name: 'furniture_assembly', price: 60 },
      { name: 'tv_mount', price: 80 },
    ],
  },
  {
    slug: 'pest_control',
    title: 'Pest Control',
    description: 'Certified pest mitigation specialists.',
    defaultPriceLow: 200,
    defaultPriceHigh: 340,
    defaultRadiusKm: 26,
    defaultWorkingDays: [1, 2, 3, 4, 5, 6],
    extras: [
      { name: 'termites', price: 180 },
      { name: 'fogging', price: 150 },
    ],
  },
  {
    slug: 'ac_service',
    title: 'AC Service',
    description: 'Air conditioner tune-ups and chemical washes.',
    defaultPriceLow: 180,
    defaultPriceHigh: 320,
    defaultRadiusKm: 24,
    defaultWorkingDays: [1, 2, 3, 4, 5, 6],
    extras: [
      { name: 'tune_up', price: 110 },
      { name: 'chemical_wash', price: 140 },
    ],
  },
  {
    slug: 'moving',
    title: 'Moving',
    description: 'Reliable movers for every relocation.',
    defaultPriceLow: 260,
    defaultPriceHigh: 520,
    defaultRadiusKm: 40,
    defaultWorkingDays: [0, 1, 2, 3, 4, 5],
    extras: [
      { name: 'packing', price: 130 },
      { name: 'unpacking', price: 110 },
      { name: 'storage', price: 180 },
    ],
  },
];

const pros = [
  {
    slug: 'sparkle-cleaners',
    serviceSlug: 'cleaning',
    name: 'Sparkle Cleaners',
    image: 'https://cdn.homeflow.app/pros/sparkle-cleaners.png',
    imageAlt: 'Sparkle Cleaners team in uniform',
    rating: 4.8,
    reviewsCount: 212,
    priceFrom: 120,
    currency: 'MYR',
    latitude: 3.139,
    longitude: 101.686,
    serviceRadiusKm: 20,
    workingDays: [1, 2, 3, 4, 5, 6],
    baseQuoteLow: 120,
    baseQuoteHigh: 180,
    timeWindows: [
      { start: '09:00', end: '11:00' },
      { start: '11:30', end: '13:30' },
      { start: '14:00', end: '16:00' },
    ],
    badges: ['Vetted', 'Eco products'],
    extras: [
      { name: 'deep_clean', price: 80 },
      { name: 'windows', price: 40 },
      { name: 'laundry', price: 50 },
    ],
  },
  {
    slug: 'klang-valley-clean',
    serviceSlug: 'cleaning',
    name: 'Klang Valley Clean',
    image: 'https://cdn.homeflow.app/pros/klang-valley-clean.png',
    imageAlt: 'Cleaner wiping kitchen counter',
    rating: 4.6,
    reviewsCount: 88,
    priceFrom: 100,
    currency: 'MYR',
    latitude: 3.112,
    longitude: 101.653,
    serviceRadiusKm: 18,
    workingDays: [1, 2, 3, 4, 5],
    baseQuoteLow: 110,
    baseQuoteHigh: 160,
    timeWindows: [
      { start: '08:30', end: '10:30' },
      { start: '12:30', end: '14:30' },
      { start: '15:00', end: '17:00' },
    ],
    badges: ['Vetted', 'Budget friendly'],
    extras: [
      { name: 'deep_clean', price: 70 },
      { name: 'windows', price: 35 },
      { name: 'fridge', price: 45 },
    ],
  },
  {
    slug: 'rapidfix-plumbing',
    serviceSlug: 'plumbing',
    name: 'RapidFix Plumbing',
    image: 'https://cdn.homeflow.app/pros/rapidfix-plumbing.png',
    imageAlt: 'RapidFix plumber repairing sink',
    rating: 4.9,
    reviewsCount: 134,
    priceFrom: 180,
    currency: 'MYR',
    latitude: 3.157,
    longitude: 101.704,
    serviceRadiusKm: 22,
    workingDays: [0, 1, 2, 3, 4, 5],
    baseQuoteLow: 180,
    baseQuoteHigh: 260,
    timeWindows: [
      { start: '08:00', end: '10:00' },
      { start: '10:30', end: '12:30' },
      { start: '17:00', end: '19:00' },
    ],
    badges: ['Vetted', 'Same-day'],
    extras: [
      { name: 'emergency', price: 130 },
      { name: 'fixture_install', price: 95 },
    ],
  },
  {
    slug: 'pipeguard-pros',
    serviceSlug: 'plumbing',
    name: 'PipeGuard Pros',
    image: 'https://cdn.homeflow.app/pros/pipeguard-pros.png',
    imageAlt: 'PipeGuard plumber with toolbox',
    rating: 4.5,
    reviewsCount: 76,
    priceFrom: 150,
    currency: 'MYR',
    latitude: 3.091,
    longitude: 101.639,
    serviceRadiusKm: 18,
    workingDays: [1, 2, 3, 4, 5, 6],
    baseQuoteLow: 150,
    baseQuoteHigh: 230,
    timeWindows: [
      { start: '09:00', end: '11:00' },
      { start: '13:00', end: '15:00' },
      { start: '15:30', end: '17:30' },
    ],
    badges: ['Vetted', 'Budget friendly'],
    extras: [
      { name: 'emergency', price: 110 },
      { name: 'fixture_install', price: 85 },
    ],
  },
  {
    slug: 'voltsure-electric',
    serviceSlug: 'electrical',
    name: 'VoltSure Electric',
    image: 'https://cdn.homeflow.app/pros/voltsure-electric.png',
    imageAlt: 'Electrician installing lighting',
    rating: 4.7,
    reviewsCount: 98,
    priceFrom: 160,
    currency: 'MYR',
    latitude: 3.087,
    longitude: 101.608,
    serviceRadiusKm: 25,
    workingDays: [1, 2, 3, 4, 5, 6],
    baseQuoteLow: 160,
    baseQuoteHigh: 240,
    timeWindows: [
      { start: '09:00', end: '11:00' },
      { start: '13:00', end: '15:00' },
      { start: '16:00', end: '18:00' },
    ],
    badges: ['Vetted', 'Licensed'],
    extras: [
      { name: 'ceiling_fan', price: 70 },
      { name: 'rewiring', price: 160 },
      { name: 'emergency', price: 140 },
    ],
  },
  {
    slug: 'fixit-handyman',
    serviceSlug: 'handyman',
    name: 'Fix-It Handyman Crew',
    image: 'https://cdn.homeflow.app/pros/fixit-handyman.png',
    imageAlt: 'Handyman fixing cabinet door',
    rating: 4.6,
    reviewsCount: 65,
    priceFrom: 140,
    currency: 'MYR',
    latitude: 3.055,
    longitude: 101.45,
    serviceRadiusKm: 24,
    workingDays: [1, 2, 3, 4, 5, 6],
    baseQuoteLow: 140,
    baseQuoteHigh: 220,
    timeWindows: [
      { start: '08:30', end: '10:30' },
      { start: '11:30', end: '13:30' },
      { start: '14:30', end: '16:30' },
    ],
    badges: ['Vetted', 'Same-day'],
    extras: [
      { name: 'furniture_assembly', price: 60 },
      { name: 'tv_mount', price: 90 },
      { name: 'drywall_patch', price: 75 },
    ],
  },
  {
    slug: 'shield-pest-control',
    serviceSlug: 'pest_control',
    name: 'Shield Pest Control',
    image: 'https://cdn.homeflow.app/pros/shield-pest-control.png',
    imageAlt: 'Exterminator spraying pesticide',
    rating: 4.7,
    reviewsCount: 58,
    priceFrom: 220,
    currency: 'MYR',
    latitude: 3.2,
    longitude: 101.65,
    serviceRadiusKm: 30,
    workingDays: [1, 2, 3, 4, 5, 6],
    baseQuoteLow: 210,
    baseQuoteHigh: 320,
    timeWindows: [
      { start: '09:00', end: '11:00' },
      { start: '13:00', end: '15:00' },
    ],
    badges: ['Vetted', 'Child-safe'],
    extras: [
      { name: 'termites', price: 210 },
      { name: 'fogging', price: 160 },
    ],
  },
  {
    slug: 'coolcomfort-ac',
    serviceSlug: 'ac_service',
    name: 'CoolComfort AC',
    image: 'https://cdn.homeflow.app/pros/coolcomfort-ac.png',
    imageAlt: 'Technician servicing air conditioner',
    rating: 4.8,
    reviewsCount: 140,
    priceFrom: 180,
    currency: 'MYR',
    latitude: 3.045,
    longitude: 101.617,
    serviceRadiusKm: 28,
    workingDays: [1, 2, 3, 4, 5, 6],
    baseQuoteLow: 180,
    baseQuoteHigh: 260,
    timeWindows: [
      { start: '08:00', end: '10:00' },
      { start: '11:00', end: '13:00' },
      { start: '14:00', end: '16:00' },
    ],
    badges: ['Vetted', 'Energy efficient'],
    extras: [
      { name: 'tune_up', price: 110 },
      { name: 'chemical_wash', price: 140 },
    ], 
  },
  {
    slug: 'moveswift-logistics',
    serviceSlug: 'moving',
    name: 'MoveSwift Logistics',
    image: 'https://cdn.homeflow.app/pros/moveswift-logistics.png',
    imageAlt: 'Moving crew loading truck',
    rating: 4.6,
    reviewsCount: 74,
    priceFrom: 260,
    currency: 'MYR',
    latitude: 3.105,
    longitude: 101.642,
    serviceRadiusKm: 35,
    workingDays: [1, 2, 3, 4, 5, 6],
    baseQuoteLow: 260,
    baseQuoteHigh: 520,
    timeWindows: [
      { start: '08:00', end: '12:00' },
      { start: '13:00', end: '17:00' },
    ],
    badges: ['Vetted', 'Full-service'],
    extras: [
      { name: 'packing', price: 140 },
      { name: 'unpacking', price: 120 },
      { name: 'long_distance', price: 260 },
    ],
  },
];

const reviews = [
  { proSlug: 'sparkle-cleaners', rating: 4.9, review: 'Team arrived early and polished every surface.', daysAgo: 5 },
  { proSlug: 'brightnest-cleaning', rating: 4.7, review: 'Great attention to detail on the windows.', daysAgo: 11 },
  { proSlug: 'rapidfix-plumbing', rating: 5, review: 'Fixed a nasty leak in under 20 minutes.', daysAgo: 2 },
  { proSlug: 'flowmaster-plumbers', rating: 4.6, review: 'Explained every step and tidied the workspace.', daysAgo: 8 },
  { proSlug: 'voltsure-electric', rating: 4.8, review: 'Rewired my living room safely with zero fuss.', daysAgo: 9 },
  { proSlug: 'ampguard-electrical', rating: 4.9, review: 'Installed smart switches perfectly.', daysAgo: 3 },
  { proSlug: 'fixit-handyman', rating: 4.7, review: 'Mounted shelves and TV flawlessly.', daysAgo: 6 },
  { proSlug: 'kuala-fixers', rating: 4.5, review: 'Fixed our sliding door on the first visit.', daysAgo: 12 },
  { proSlug: 'shield-pest-control', rating: 4.9, review: 'No more ants and the pets stayed safe.', daysAgo: 7 },
  { proSlug: 'coolcomfort-ac', rating: 4.8, review: 'Air feels fresher after the chemical wash.', daysAgo: 4 },
];

const sampleUser = {
  email: 'user@homeflow.app',
  name: 'Amelia Chong',
};

async function main() {
  console.log('Clearing existing data…');
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.proTimeWindow.deleteMany();
  await prisma.proBadge.deleteMany();
  await prisma.proExtra.deleteMany();
  await prisma.pro.deleteMany();
  await prisma.serviceExtra.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding services…');
  const serviceMap = new Map();
  for (const service of services) {
    const created = await prisma.service.create({
      data: {
        slug: service.slug,
        title: service.title,
        description: service.description,
        defaultPriceLow: service.defaultPriceLow,
        defaultPriceHigh: service.defaultPriceHigh,
        defaultRadiusKm: service.defaultRadiusKm,
        defaultWorkingDays: service.defaultWorkingDays,
        extras: {
          create: service.extras,
        },
      },
    });
    serviceMap.set(service.slug, created);
  }

  console.log('Seeding providers…');
  const proMap = new Map();
  for (const pro of pros) {
    const service = serviceMap.get(pro.serviceSlug);
    if (!service) continue;
    const created = await prisma.pro.create({
      data: {
        slug: pro.slug,
        serviceId: service.id,
        name: pro.name,
        image: pro.image,
        imageAlt: pro.imageAlt,
        rating: pro.rating,
        reviewsCount: pro.reviewsCount,
        priceFrom: pro.priceFrom,
        currency: pro.currency,
        latitude: pro.latitude,
        longitude: pro.longitude,
        serviceRadiusKm: pro.serviceRadiusKm,
        workingDays: pro.workingDays,
        baseQuoteLow: pro.baseQuoteLow,
        baseQuoteHigh: pro.baseQuoteHigh,
        timeWindows: { create: pro.timeWindows },
        badges: { create: pro.badges.map((label) => ({ label })) },
        extras: { create: pro.extras },
      },
      include: { service: true },
    });
    proMap.set(pro.slug, created);
  }

  console.log('Seeding user…');
  const user = await prisma.user.create({ data: sampleUser });

  console.log('Seeding bookings and reviews…');
  const now = new Date();

  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const cleanerPros = ['sparkle-cleaners', 'klang-valley-clean'];

  for (const slug of cleanerPros) {
    const pro = proMap.get(slug);
    if (!pro) continue;
    const window = pro.timeWindows?.[0];
    if (!window) continue;
    const start = new Date(tomorrow);
    start.setHours(Number(window.start.slice(0, 2)) || 9, Number(window.start.slice(3, 5)) || 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(Number(window.end.slice(0, 2)) || 11, Number(window.end.slice(3, 5)) || 0, 0, 0);
    await prisma.booking.create({
      data: {
        proId: pro.id,
        serviceId: pro.serviceId,
        userId: user.id,
        start,
        end,
        status: 'confirmed',
        priceEstimate: pro.priceFrom,
        address: DEFAULT_ADDRESS,
        instructions: 'Please call when you arrive at the lobby.',
      },
    });
  }

  const historyPro = proMap.get('klang-valley-clean');
  if (historyPro) {
    const pastDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const window = historyPro.timeWindows?.[0];
    if (window) {
      const start = new Date(pastDate);
      start.setHours(Number(window.start.slice(0, 2)) || 9, Number(window.start.slice(3, 5)) || 0, 0, 0);
      const end = new Date(pastDate);
      end.setHours(Number(window.end.slice(0, 2)) || 11, Number(window.end.slice(3, 5)) || 0, 0, 0);
      const booking = await prisma.booking.create({
        data: {
          proId: historyPro.id,
          serviceId: historyPro.serviceId,
          userId: user.id,
          start,
          end,
          status: 'completed',
          priceEstimate: 140,
          address: DEFAULT_ADDRESS,
          instructions: 'Focus on the kitchen, please.',
          rating: 5,
          reviewText: 'Super thorough and friendly!',
        },
      });
      await prisma.review.create({
        data: {
          proId: historyPro.id,
          userId: user.id,
          bookingId: booking.id,
          rating: 5,
          review: 'Super thorough and friendly!',
          createdAt: booking.updatedAt,
        },
      });
    }
  }

  console.log('Seeding historical reviews…');
  for (const entry of reviews) {
    const pro = proMap.get(entry.proSlug);
    if (!pro) continue;
    const createdAt = new Date(now.getTime() - entry.daysAgo * 24 * 60 * 60 * 1000);
    await prisma.review.create({
      data: {
        proId: pro.id,
        rating: entry.rating,
        review: entry.review,
        createdAt,
        updatedAt: createdAt,
      },
    });
  }

  console.log('HomeFlow database seeded successfully.');
}

main()
  .catch((error) => {
    console.error('Failed to seed HomeFlow data:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
