import { NextRequest, NextResponse } from 'next/server';
import { handleSecretWebhook } from '@/lib/secrets/secrets-manager';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-infisical-signature');

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Missing signature header' },
        { status: 401 }
      );
    }

    const result = await handleSecretWebhook(rawBody, signature);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('POST /api/webhooks/secrets error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}
