import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 192,
  height: 192,
};

export const contentType = 'image/png';

export default async function Icon() {
  return new ImageResponse(
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
          width="140"
          height="140"
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
          {/* Handle */}
          <path
            d="M95 32 C95 20, 120 20, 120 32 L120 42 C120 46, 95 46, 95 42 Z"
            fill="none"
            stroke="#DC2626"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* Body */}
          <circle cx="107" cy="68" r="28" fill="#DC2626" />
          {/* Highlight */}
          <circle cx="100" cy="60" r="8" fill="#EF4444" opacity="0.6" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
