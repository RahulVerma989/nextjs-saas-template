import { NextRequest, NextResponse } from 'next/server';
import { handleDodoWebhook } from '@/lib/payments/webhook-handler';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const headers = Object.fromEntries(req.headers.entries());

    const result = await handleDodoWebhook(rawBody, headers);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('POST /api/webhooks/dodo error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}
