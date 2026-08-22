import { Outlet } from 'react-router-dom';
import { Box, Container, Typography, Stack } from '@mui/material';
import PublicNavbar from './PublicNavbar';

export default function PublicLayout() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <PublicNavbar />
      <Box component="main" sx={{ flex: 1 }}>
        <Outlet />
      </Box>
      <Box component="footer" sx={{ borderTop: '1px solid', borderColor: 'divider', py: 4, mt: 6 }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} MediCore Hospital Management System.
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: '"IBM Plex Mono", monospace' }}>
              Built for care teams that never stop moving.
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
