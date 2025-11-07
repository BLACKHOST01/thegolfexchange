-- CreateTable
CREATE TABLE "Event" (
    "id" BIGSERIAL NOT NULL,
    "visitorId" VARCHAR(64),
    "userId" UUID,
    "sessionId" VARCHAR(64),
    "eventType" VARCHAR(64) NOT NULL,
    "eventProperties" JSONB,
    "url" TEXT,
    "referrer" TEXT,
    "userAgent" TEXT,
    "ipAddr" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Event_eventType_idx" ON "Event"("eventType");

-- CreateIndex
CREATE INDEX "Event_visitorId_idx" ON "Event"("visitorId");

-- CreateIndex
CREATE INDEX "Event_userId_idx" ON "Event"("userId");

-- CreateIndex
CREATE INDEX "Event_createdAt_idx" ON "Event"("createdAt");
