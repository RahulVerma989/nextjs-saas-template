import { NextRequest, NextResponse } from 'next/server';
import { siteConfig } from '@/config/site.config';
import { connectDB } from '@/lib/db/connection';
import { WaitlistEntry } from '@/lib/db/models/waitlist.model';

export async function POST(req: NextRequest) {
  if (!siteConfig.features.waitlist) {
    return NextResponse.json({ success: false, error: 'Waitlist is not enabled' }, { status: 404 });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Valid email is required' }, { status: 400 });
    }

    await connectDB();

    // Upsert to handle duplicates gracefully
    await WaitlistEntry.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { email: email.toLowerCase().trim() },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, message: "You're on the list!" });
  } catch (error) {
    console.error('Waitlist error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}
