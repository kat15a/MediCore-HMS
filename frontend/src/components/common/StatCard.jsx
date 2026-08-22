import { Box, Card, Stack, Typography } from '@mui/material';

/**
 * A single KPI tile for dashboards (e.g. "Total Patients: 1,204"). The
 * value is rendered in the mono data typeface so figures read like
 * instrument readings, consistent with the design system's data type role.
 */
export default function StatCard({ label, value, icon: Icon, tone = 'primary', suffix }) {
  return (
    <Card sx={{ p: 2.5, height: '100%' }}>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        {Icon && (
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: `${tone}.main`,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            <Icon fontSize="small" />
          </Box>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary" noWrap>
            {label}
          </Typography>
          <Typography
            sx={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontWeight: 600,
              fontSize: 24,
              lineHeight: 1.3,
              mt: 0.25,
            }}
          >
            {value}
            {suffix && (
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                {suffix}
              </Typography>
            )}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
}
