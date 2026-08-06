import React from 'react';

interface ProgressBarProps {
  total: number;
  current: number;
}

export default function ProgressBar({ total, current }: ProgressBarProps) {
  return (
    <div className="progress-bar" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={total}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`progress-bar__seg${i < current ? ' filled' : ''}`} />
      ))}
    </div>
  );
}
