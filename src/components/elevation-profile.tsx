import type { RouteSample } from "@/lib/replay-types";

export function ElevationProfile({ samples, progress, onSeek }: { samples: RouteSample[]; progress: number; onSeek: (progress: number) => void }) {
  const elevated = samples.filter((sample): sample is RouteSample & { elevationMeters: number } => sample.elevationMeters !== null);
  if (elevated.length < 2) return <div className="elevation-unavailable">Elevation unavailable for this route</div>;
  const min = Math.min(...elevated.map((sample) => sample.elevationMeters));
  const max = Math.max(...elevated.map((sample) => sample.elevationMeters));
  const range = Math.max(1, max - min);
  const points = elevated.map((sample) => `${sample.progress * 100},${36 - ((sample.elevationMeters - min) / range) * 30}`).join(" ");

  return (
    <button
      className="elevation-chart"
      type="button"
      aria-label="Elevation profile. Click to seek through the replay."
      onClick={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        onSeek((event.clientX - bounds.left) / bounds.width);
      }}
    >
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="elevation-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#52f2ad" stopOpacity=".42" />
            <stop offset="1" stopColor="#52f2ad" stopOpacity=".03" />
          </linearGradient>
        </defs>
        <polygon points={`0,40 ${points} 100,40`} fill="url(#elevation-fill)" />
        <polyline points={points} fill="none" stroke="#52f2ad" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <line x1={progress * 100} x2={progress * 100} y1="2" y2="40" stroke="#ffffff" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
    </button>
  );
}
