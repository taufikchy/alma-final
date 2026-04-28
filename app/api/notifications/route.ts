import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const DEFAULT_REMINDER_TITLE = 'ALMA - Reminder Minum TTD';
const DEFAULT_REMINDER_MESSAGE = 'Jangan lupa minum Tablet Tambah Darah (TTD) hari ini ya Bund!';
const DEFAULT_VIBRATION_PATTERN = [1200, 250, 1200, 250, 1200, 600, 1800, 400, 1200];

export async function POST(request: Request) {
  try {
    const { patientId, title, message } = await request.json();

    if (!patientId) {
      return NextResponse.json({ message: 'Patient ID is required' }, { status: 400 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true },
    });

    if (!patient) {
      return NextResponse.json({ message: 'Patient not found' }, { status: 404 });
    }

    const notification = await prisma.notification.create({
      data: {
        userId: patient.userId,
        message: message || 'Jangan lupa minum Tablet Tambah Darah (TTD) hari ini ya Bund!',
      },
    });

    // Send push notification via OneSignal
    try {
      const onesignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
      const onesignalApiKey = process.env.ONESIGNAL_REST_API_KEY;
      const baseUrl = process.env.NEXTAUTH_URL || new URL(request.url).origin;
      const notificationTitle = title || DEFAULT_REMINDER_TITLE;
      const notificationMessage = message || DEFAULT_REMINDER_MESSAGE;
      const targetUrl = `${baseUrl}/patient/dashboard`;

      if (onesignalAppId && onesignalApiKey) {
        console.log('[OneSignal] Sending push notification to patient:', patientId);
        const response = await fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': `Basic ${onesignalApiKey}`,
          },
          body: JSON.stringify({
            app_id: onesignalAppId,
            include_external_user_ids: [patientId],
            headings: { en: notificationTitle },
            contents: { en: notificationMessage },
            url: targetUrl,
            web_url: targetUrl,
            chrome_web_icon: `${baseUrl}/logo.png`,
            chrome_web_badge: `${baseUrl}/logo.png`,
            web_buttons: [
              {
                id: 'open-alma',
                text: 'Buka ALMA',
                url: targetUrl,
              },
            ],
            data: {
              url: '/patient/dashboard',
              title: notificationTitle,
              body: notificationMessage,
              tag: 'alma-reminder',
              vibrate: DEFAULT_VIBRATION_PATTERN,
            },
            android_accent_color: 'FF4CAF50',
            priority: 10,
            ttl: 3600,
          }),
        });
        
        const responseData = await response.json();
        console.log('[OneSignal] Response:', responseData);
      } else {
        console.warn('[OneSignal] Missing App ID or API Key in environment variables');
      }
    } catch (osError) {
      console.error('OneSignal Push Error:', osError);
    }

    return NextResponse.json({
      success: true,
      notification,
      patientName: patient.name,
    }, { status: 200 });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId');
  const unreadOnly = searchParams.get('unread') === 'true';

  try {
    const whereClause: Record<string, unknown> = {};

    if (patientId) {
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
      });
      if (patient) {
        whereClause.userId = patient.userId;
      }
    }

    if (unreadOnly) {
      whereClause.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(notifications, { status: 200 });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { notificationId, markAllRead, userId } = await request.json();

    if (markAllRead && userId) {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: 'All notifications marked as read' }, { status: 200 });
    }

    if (notificationId) {
      const notification = await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
      return NextResponse.json(notification, { status: 200 });
    }

    return NextResponse.json({ message: 'Notification ID or markAllRead required' }, { status: 400 });

  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
