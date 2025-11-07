// Create a simple script to add test data
// app/admin/test-data/route.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Add a test event
    const event = await prisma.event.create({
      data: {
        eventType: 'page_view',
        visitorId: 'test_visitor_123',
        url: '/test-page',
        userAgent: 'Mozilla/5.0 (Test)',
        ipAddr: '127.0.0.1'
      }
    });

    return new Response(JSON.stringify({ success: true, event }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await prisma.$disconnect();
  }
}