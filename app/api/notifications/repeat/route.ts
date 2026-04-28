import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const REMINDER_INTERVAL_MINUTES = 5;
const REMINDER_START_HOUR = 19;
const JAKARTA_OFFSET_HOURS = 7;
const DEFAULT_REMINDER_TITLE = 'ALMA - Reminder Minum TTD';
const DEFAULT_REMINDER_MESSAGE = 'Jangan lupa minum Tablet Tambah Darah (TTD) hari ini ya Bund!';
const DEFAULT_VIBRATION_PATTERN = [1200, 250, 1200, 250, 1200, 600, 1800, 400, 1200];

function getJakartaNow() {
  const now = new Date();
  const jakartaShifted = new Date(now.getTime() + JAKARTA_OFFSET_HOURS * 60 * 60 * 1000);

  return {
    now,
    year: jakartaShifted.getUTCFullYear(),
    month: jakartaShifted.getUTCMonth(),
    date: jakartaShifted.getUTCDate(),
    hour: jakartaShifted.getUTCHours(),
  };
}

function getJakartaDayRange() {
  const { year, month, date } = getJakartaNow();
  const startUtc = new Date(Date.UTC(year, month, date, -JAKARTA_OFFSET_HOURS, 0, 0, 0));
  const endUtc = new Date(Date.UTC(year, month, date + 1, -JAKARTA_OFFSET_HOURS, 0, 0, 0));

  return { startUtc, endUtc };
}

async function sendOneSignalPush(patientId: string, origin: string, title: string, message: string) {
  const onesignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const onesignalApiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!onesignalAppId || !onesignalApiKey) {
    return { sent: false, reason: 'OneSignal credentials are missing' };
  }

  const targetUrl = `${origin}/patient/dashboard`;
  const response = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Basic ${onesignalApiKey}`,
    },
    body: JSON.stringify({
      app_id: onesignalAppId,
      include_external_user_ids: [patientId],
      headings: { en: title },
      contents: { en: message },
      url: targetUrl,
      web_url: targetUrl,
      chrome_web_icon: `${origin}/logo.png`,
      chrome_web_badge: `${origin}/logo.png`,
      web_buttons: [
        {
          id: 'open-alma',
          text: 'Buka ALMA',
          url: targetUrl,
        },
      ],
      data: {
        url: '/patient/dashboard',
        title,
        body: message,
        tag: 'alma-reminder',
        vibrate: DEFAULT_VIBRATION_PATTERN,
      },
      android_accent_color: 'FF4CAF50',
      priority: 10,
      ttl: 3600,
    }),
  });

  const responseData = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof responseData?.errors?.[0] === 'string'
        ? responseData.errors[0]
        : 'Failed to send OneSignal push notification'
    );
  }

  return { sent: true, responseData };
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const isVercelCron = request.headers.get('x-vercel-cron') === '1';
    const cronSecret = process.env.CRON_SECRET;
    const forceRun = request.nextUrl.searchParams.get('force') === '1';

    if (!isVercelCron && (!cronSecret || authHeader !== `Bearer ${cronSecret}`)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const jakartaNow = getJakartaNow();
    if (!forceRun && jakartaNow.hour < REMINDER_START_HOUR) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: `Belum jam ${REMINDER_START_HOUR}.00 WIB`,
      });
    }

    const { startUtc, endUtc } = getJakartaDayRange();
    const recentReminderCutoff = new Date(Date.now() - REMINDER_INTERVAL_MINUTES * 60 * 1000);
    const origin = process.env.NEXTAUTH_URL || request.nextUrl.origin;

    const patients = await prisma.patient.findMany({
      where: {
        dailyChecks: {
          none: {
            date: {
              gte: startUtc,
              lt: endUtc,
            },
          },
        },
      },
      include: {
        user: true,
      },
    });

    let sentCount = 0;
    let skippedRecentCount = 0;
    let failedCount = 0;
    const failures: { patientId: string; reason: string }[] = [];

    for (const patient of patients) {
      const alreadySentRecently = await prisma.notification.findFirst({
        where: {
          userId: patient.userId,
          message: DEFAULT_REMINDER_MESSAGE,
          createdAt: {
            gte: recentReminderCutoff,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (alreadySentRecently) {
        skippedRecentCount += 1;
        continue;
      }

      try {
        await sendOneSignalPush(
          patient.id,
          origin,
          DEFAULT_REMINDER_TITLE,
          DEFAULT_REMINDER_MESSAGE
        );

        await prisma.notification.create({
          data: {
            userId: patient.userId,
            message: DEFAULT_REMINDER_MESSAGE,
          },
        });

        sentCount += 1;
      } catch (error) {
        failedCount += 1;
        failures.push({
          patientId: patient.id,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      checkedAt: new Date().toISOString(),
      reminderIntervalMinutes: REMINDER_INTERVAL_MINUTES,
      eligiblePatients: patients.length,
      sentCount,
      skippedRecentCount,
      failedCount,
      failures,
    });
  } catch (error) {
    console.error('[Repeat Reminder Cron Error]:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
