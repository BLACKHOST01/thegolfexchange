import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {prisma} from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        notificationSettings: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return default settings if none exist
    const defaultSettings = {
      email: { orders: true, promotions: true, security: true },
      push: { orders: true, promotions: true },
      sms: { orders: false, security: true },
    };

    const settings = user.notificationSettings || defaultSettings;

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate the structure
    const requiredChannels = ['email', 'push', 'sms'];
    for (const channel of requiredChannels) {
      if (!body[channel] || typeof body[channel] !== 'object') {
        return NextResponse.json(
          { error: `Invalid notification settings structure for ${channel}` },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update notification settings
    await prisma.user.update({
      where: { id: user.id },
      data: {
        notificationSettings: body,
      },
    });

    return NextResponse.json({ success: true, message: 'Notification settings updated' });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}