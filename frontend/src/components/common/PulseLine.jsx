import { useId } from 'react';
import { Box } from '@mui/material';

/**
 * The one recurring signature element: a heartbeat/ECG trace rendered as a
 * thin SVG line. Used as a section divider on the landing page, and as a
 * compact mark next to the wordmark in the navbar. Motion is a single slow
 * dash-offset sweep — respects prefers-reduced-motion.
 */
export default function PulseLine({ height = 48, color = 'currentColor', animated = true, sx = {} }) {
  const id = useId();

  return (
    <Box
      sx={{
        width: '100%',
        height,
        color,
        overflow: 'hidden',
        '@media (prefers-reduced-motion: reduce)': {
          '& .pulse-path': { animation: 'none !important' },
        },
        ...sx,
      }}
    >
      <svg
        viewBox="0 0 600 60"
        preserveAspectRatio="none"
        width="100%"
        height="100%"
        role="presentation"
        aria-hidden="true"
      >
        <path
          className="pulse-path"
          d="M0,30 L140,30 L160,30 L172,8 L188,52 L204,18 L216,30 L260,30 L276,10 L292,50 L308,30 L600,30"
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={
            animated
              ? {
                  strokeDasharray: 900,
                  strokeDashoffset: 900,
                  animation: 'medicore-pulse-draw 3.2s ease-in-out infinite',
                }
              : undefined
          }
        />
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
            <stop offset="45%" stopColor="currentColor" stopOpacity="0.9" />
            <stop offset="55%" stopColor="currentColor" stopOpacity="0.9" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.15" />
          </linearGradient>
        </defs>
      </svg>
      <style>{`
        @keyframes medicore-pulse-draw {
          0% { stroke-dashoffset: 900; }
          60% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -900; }
        }
      `}</style>
    </Box>
  );
}
