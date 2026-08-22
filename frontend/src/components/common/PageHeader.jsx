import { Box, Button, Stack, Typography } from '@mui/material';

/**
 * Consistent title + subtitle + primary action bar used at the top of
 * every dashboard screen (list pages, detail pages, forms).
 */
export default function PageHeader({ title, subtitle, actionLabel, actionIcon, onAction, children }) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      spacing={2}
      sx={{ mb: 3 }}
    >
      <Box>
        <Typography variant="h4" sx={{ fontSize: { xs: 24, md: 28 } }}>{title}</Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      <Stack direction="row" spacing={1.5} alignItems="center">
        {children}
        {actionLabel && (
          <Button variant="contained" startIcon={actionIcon} onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
