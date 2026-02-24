import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

// Generates /icon.png — replaces the static SVG favicon with a proper PNG.
export default function Icon() {
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
          borderRadius: '6px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            width: '20px',
          }}
        >
          <div style={{ background: '#fef08a', height: '5px', borderRadius: '2px', width: '20px' }} />
          <div style={{ background: '#bbf7d0', height: '5px', borderRadius: '2px', width: '16px' }} />
          <div style={{ background: '#bfdbfe', height: '5px', borderRadius: '2px', width: '12px' }} />
        </div>
      </div>
    ),
    { ...size },
  );
}
