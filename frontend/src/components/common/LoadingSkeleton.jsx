import { Box, Skeleton, Stack } from '@mui/material';

export function CardSkeleton({ count = 1 }) {
  return (
    <Stack spacing={2}>
      {Array.from({ length: count }).map((_, i) => (
        <Box key={i} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Skeleton variant="text" width="40%" height={28} />
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="text" width="55%" />
        </Box>
      ))}
    </Stack>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <Stack spacing={1}>
      {Array.from({ length: rows }).map((_, r) => (
        <Stack key={r} direction="row" spacing={2}>
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} variant="text" width={`${100 / columns}%`} height={36} />
          ))}
        </Stack>
      ))}
    </Stack>
  );
}

export function StatCardSkeleton({ count = 4 }) {
  return (
    <Stack direction="row" spacing={2} flexWrap="wrap">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="rounded" width={220} height={110} />
      ))}
    </Stack>
  );
}

export function FullPageLoader() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <Skeleton variant="circular" width={40} height={40} />
    </Box>
  );
}
