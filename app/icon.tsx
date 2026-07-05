import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: '#161616',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'inset -4px -4px 8px rgba(0,0,0,0.5), inset 3px 3px 6px rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: '#f4ead9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: '#161616',
              fontFamily: 'sans-serif',
              lineHeight: 1,
            }}
          >
            8
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
