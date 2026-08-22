import { Box, Stack, Typography } from '@mui/material';
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';

/**
 * Temporary placeholder for role-dashboard routes whose full CRUD screens
 * land in Module 6. Keeps every nav link in navConfig.js clickable and
 * routable right now instead of 404ing.
 */
export default function ComingSoonPage({ title }) {
  return (
    <Box sx={{ py: 8 }}>
      <Stack spacing={2} alignItems="center" textAlign="center">
        <ConstructionOutlinedIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
        <Typography variant="h5">{title}</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
          This screen is being built in the next module. The route, layout, and navigation are already wired up.
        </Typography>
      </Stack>
    </Box>
  );
}
