-- Create Quote table for HomeFlow MCP tools
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "proId" INTEGER,
    "estimateLow" INTEGER NOT NULL,
    "estimateHigh" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "suggestedDateStart" TIMESTAMP(3) NOT NULL,
    "suggestedDateEnd" TIMESTAMP(3) NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Quote_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Quote_proId_fkey" FOREIGN KEY ("proId") REFERENCES "Pro"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Quote_serviceId_idx" ON "Quote"("serviceId");
CREATE INDEX "Quote_proId_idx" ON "Quote"("proId");

-- Link bookings to quotes
ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
