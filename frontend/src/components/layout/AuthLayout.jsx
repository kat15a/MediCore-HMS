import { Link as RouterLink, Outlet } from 'react-router-dom';
import { Box, Container, Paper, Stack, Typography } from '@mui/material';
import PulseLine from '../common/PulseLine';

/**
 * Shared shell for /login, /register, /forgot-password, /reset-password,
 * /verify-email. A single centered card keeps the auth flow calm and
 * focused — no nav distractions, just the pulse-line mark tying it back
 * to the main brand.
 */
export default function AuthLayout() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'primary.dark',
        py: { xs: 4, md: 0 },
      }}
    >
      <Container maxWidth="sm" sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Stack alignItems="center" spacing={1} sx={{ mb: 4 }}>
          <Box component={RouterLink} to="/" sx={{ textDecoration: 'none', width: 120 }}>
            <PulseLine height={28} color="#fff" />
          </Box>
          <Typography
            variant="h5"
            component={RouterLink}
            to="/"
            sx={{ color: '#fff', textDecoration: 'none', fontWeight: 700 }}
          >
            MediCore
          </Typography>
        </Stack>

        <Paper elevation={0} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 4, border: 'none' }}>
          <Outlet />
        </Paper>

        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', mt: 3 }}>
          © {new Date().getFullYear()} MediCore Hospital Management System
        </Typography>
      </Container>
    </Box>
  );
}
