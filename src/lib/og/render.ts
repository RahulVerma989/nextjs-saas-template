import { ImageResponse } from 'next/og';
import type { OGImageData } from './types';

const WIDTH = 1200;
const HEIGHT = 630;

/**
 * Render an OG image using Satori/ImageResponse.
 * This is the default template - customize as needed.
 */
export function renderOGImage(data: OGImageData): ImageResponse {
  const primaryColor = data.primaryColor || '#6366f1';

  const element = {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 80px',
        background: `linear-gradient(135deg, ${primaryColor} 0%, #1e1b4b 100%)`,
        fontFamily: 'sans-serif',
      },
      children: [
        data.tags && data.tags.length > 0
          ? {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '20px',
                },
                children: data.tags.slice(0, 3).map((tag: string) => ({
                  type: 'span',
                  props: {
                    style: {
                      background: 'rgba(255,255,255,0.15)',
                      color: '#fff',
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '16px',
                    },
                    children: tag,
                  },
                })),
              },
            }
          : null,
        {
          type: 'h1',
          props: {
            style: {
              fontSize: data.title.length > 60 ? '48px' : '56px',
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.2,
              margin: '0 0 20px 0',
              maxWidth: '900px',
            },
            children: data.title,
          },
        },
        data.description
          ? {
              type: 'p',
              props: {
                style: {
                  fontSize: '24px',
                  color: 'rgba(255,255,255,0.8)',
                  lineHeight: 1.4,
                  margin: '0 0 30px 0',
                  maxWidth: '800px',
                },
                children: data.description.length > 120
                  ? data.description.slice(0, 117) + '...'
                  : data.description,
              },
            }
          : null,
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: 'auto',
            },
            children: [
              data.authorName
                ? {
                    type: 'span',
                    props: {
                      style: { fontSize: '18px', color: 'rgba(255,255,255,0.7)' },
                      children: data.authorName,
                    },
                  }
                : null,
              data.date
                ? {
                    type: 'span',
                    props: {
                      style: { fontSize: '18px', color: 'rgba(255,255,255,0.5)' },
                      children: data.date,
                    },
                  }
                : null,
            ].filter(Boolean),
          },
        },
      ].filter(Boolean),
    },
  };

  return new ImageResponse(element as unknown as React.ReactElement, {
    width: WIDTH,
    height: HEIGHT,
  });
}
