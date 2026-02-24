import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// Generates /apple-icon.png — used by iOS Safari for the home screen icon.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          background: '#1a1a2e',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            width: '110px',
          }}
        >
          <div style={{ background: '#fef08a', height: '16px', borderRadius: '8px', width: '110px' }} />
          <div style={{ background: '#bbf7d0', height: '16px', borderRadius: '8px', width: '90px' }} />
          <div style={{ background: '#bfdbfe', height: '16px', borderRadius: '8px', width: '72px' }} />
        </div>
      </div>
    ),
    { ...size },
  );
}
