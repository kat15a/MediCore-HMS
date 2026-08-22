import { EKG_PATH } from '../../theme/tokens';

/**
 * The app's signature visual motif: a thin abstract vital-sign waveform.
 * Used as section dividers on the landing page and as a "live" indicator
 * in dashboard headers. Deliberately abstract, not a literal heart icon.
 */
export default function Waveform({
  color = 'currentColor',
  height = 24,
  strokeWidth = 2,
  animated = false,
  style = {},
}) {
  return (
    <svg
      viewBox="0 0 260 40"
      width="100%"
      height={height}
      preserveAspectRatio="none"
      style={{ display: 'block', overflow: 'visible', ...style }}
      aria-hidden="true"
    >
      <path
        d={EKG_PATH}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={animated ? 1 : undefined}
        style={
          animated
            ? {
                strokeDasharray: 1,
                strokeDashoffset: 1,
                animation: 'medicore-waveform-draw 2.6s ease-in-out infinite',
              }
            : undefined
        }
      />
      {animated && (
        <style>{`
          @keyframes medicore-waveform-draw {
            0% { stroke-dashoffset: 1; }
            45% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: 0; opacity: 1; }
          }
        `}</style>
      )}
    </svg>
  );
}
