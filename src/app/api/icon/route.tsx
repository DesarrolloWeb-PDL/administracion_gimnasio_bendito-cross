import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const size = parseInt(searchParams.get('size') || '192');

  const response = new ImageResponse(
    (
      <div
        style={{
          background: '#000000',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '32px',
        }}
      >
        <svg
          width={size * 0.73}
          height={size * 0.73}
          viewBox="0 0 140 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Clipboard / Planilla - white */}
          <rect x="25" y="18" width="65" height="85" rx="4" fill="#FFFFFF" />
          <rect x="42" y="10" width="30" height="16" rx="4" fill="#FFFFFF" />
          <rect x="50" y="6" width="14" height="10" rx="3" stroke="#000000" strokeWidth="3" fill="none" />
          {/* Lines on clipboard */}
          <rect x="35" y="42" width="44" height="4" rx="2" fill="#CCCCCC" />
          <rect x="35" y="52" width="44" height="4" rx="2" fill="#CCCCCC" />
          <rect x="35" y="62" width="44" height="4" rx="2" fill="#CCCCCC" />
          <rect x="35" y="72" width="30" height="4" rx="2" fill="#CCCCCC" />

          {/* Kettlebell / Pesa rusa - red */}
          <path
            d="M95 32 C95 20, 120 20, 120 32 L120 42 C120 46, 95 46, 95 42 Z"
            fill="none"
            stroke="#DC2626"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <circle cx="107" cy="68" r="28" fill="#DC2626" />
          <circle cx="100" cy="60" r="8" fill="#EF4444" opacity="0.6" />
        </svg>
      </div>
    ),
    {
      width: size,
      height: size,
    }
  );

  return response;
}
