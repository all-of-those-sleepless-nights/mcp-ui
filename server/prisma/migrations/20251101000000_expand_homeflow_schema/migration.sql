-- Drop existing user table to rebuild with integer IDs
DROP TABLE IF EXISTS "User";

-- Service catalog
CREATE TABLE "Service" (
    "id" SERIAL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "defaultPriceLow" INTEGER NOT NULL,
    "defaultPriceHigh" INTEGER NOT NULL,
    "defaultRadiusKm" INTEGER,
    "defaultWorkingDays" INTEGER[] NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- Users
CREATE TABLE "User" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Service extras
CREATE TABLE "ServiceExtra" (
    "id" SERIAL PRIMARY KEY,
    "serviceId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    CONSTRAINT "ServiceExtra_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ServiceExtra_serviceId_name_key" ON "ServiceExtra"("serviceId", "name");

-- Providers
CREATE TABLE "Pro" (
    "id" SERIAL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "imageAlt" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "reviewsCount" INTEGER NOT NULL,
    "priceFrom" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "serviceRadiusKm" INTEGER NOT NULL,
    "workingDays" INTEGER[] NOT NULL,
    "baseQuoteLow" INTEGER NOT NULL,
    "baseQuoteHigh" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Pro_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Pro_slug_key" ON "Pro"("slug");
CREATE INDEX "Pro_serviceId_idx" ON "Pro"("serviceId");

-- Pro availability windows
CREATE TABLE "ProTimeWindow" (
    "id" SERIAL PRIMARY KEY,
    "proId" INTEGER NOT NULL,
    "start" TEXT NOT NULL,
    "end" TEXT NOT NULL,
    CONSTRAINT "ProTimeWindow_proId_fkey" FOREIGN KEY ("proId") REFERENCES "Pro"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ProTimeWindow_proId_idx" ON "ProTimeWindow"("proId");

-- Pro badges
CREATE TABLE "ProBadge" (
    "id" SERIAL PRIMARY KEY,
    "proId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    CONSTRAINT "ProBadge_proId_fkey" FOREIGN KEY ("proId") REFERENCES "Pro"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ProBadge_proId_label_key" ON "ProBadge"("proId", "label");
CREATE INDEX "ProBadge_proId_idx" ON "ProBadge"("proId");

-- Pro extras
CREATE TABLE "ProExtra" (
    "id" SERIAL PRIMARY KEY,
    "proId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    CONSTRAINT "ProExtra_proId_fkey" FOREIGN KEY ("proId") REFERENCES "Pro"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ProExtra_proId_name_key" ON "ProExtra"("proId", "name");
CREATE INDEX "ProExtra_proId_idx" ON "ProExtra"("proId");

-- Bookings
CREATE TABLE "Booking" (
    "id" SERIAL PRIMARY KEY,
    "proId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "userId" INTEGER,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "priceEstimate" INTEGER NOT NULL,
    "address" JSONB NOT NULL,
    "instructions" TEXT,
    "quoteId" TEXT,
    "rating" DOUBLE PRECISION,
    "reviewText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Booking_proId_fkey" FOREIGN KEY ("proId") REFERENCES "Pro"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Booking_proId_serviceId_userId_start_idx" ON "Booking"("proId", "serviceId", "userId", "start");

-- Reviews
CREATE TABLE "Review" (
    "id" SERIAL PRIMARY KEY,
    "proId" INTEGER NOT NULL,
    "userId" INTEGER,
    "bookingId" INTEGER UNIQUE,
    "rating" DOUBLE PRECISION NOT NULL,
    "review" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Review_proId_fkey" FOREIGN KEY ("proId") REFERENCES "Pro"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Review_proId_idx" ON "Review"("proId");
CREATE INDEX "Review_userId_idx" ON "Review"("userId");
CREATE INDEX "Review_bookingId_idx" ON "Review"("bookingId");
