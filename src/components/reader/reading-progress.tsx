'use client';

interface ReadingProgressProps {
  progress: number;
}

export function ReadingProgress({ progress }: ReadingProgressProps) {
  return (
    <div
      className="reading-progress"
      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
    />
  );
}
