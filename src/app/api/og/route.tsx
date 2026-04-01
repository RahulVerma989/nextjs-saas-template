import { NextRequest, NextResponse } from 'next/server';
import { getStaticPageData } from '@/lib/og/service';
import { renderOGImage } from '@/lib/og/render';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'slug query parameter is required' },
        { status: 400 }
      );
    }

    const pageData = await getStaticPageData(slug);

    if (!pageData) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }

    return renderOGImage(pageData);
  } catch (error) {
    console.error('GET /api/og error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate OG image' },
      { status: 500 }
    );
  }
}
