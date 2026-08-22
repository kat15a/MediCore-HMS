import { Link as RouterLink } from 'react-router-dom';
import { AppBar, Toolbar, Box, Typography, Button, Stack } from '@mui/material';
import PulseLine from '../common/PulseLine';

export default function PublicNavbar() {
  return (
    <AppBar position="sticky" color="inherit" sx={{ bgcolor: 'background.default' }}>
      <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" component={RouterLink} to="/" sx={{ textDecoration: 'none', color: 'inherit' }}>
          <Box sx={{ width: 34, color: 'secondary.main' }}>
            <PulseLine height={20} animated={false} />
          </Box>
          <Typography variant="h6" sx={{ fontFamily: '"Fraunces", serif', fontWeight: 600, color: 'primary.main' }}>
            MediCore
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button component={RouterLink} to="/login" color="inherit" sx={{ color: 'text.primary' }}>
            Log In
          </Button>
          <Button component={RouterLink} to="/register" variant="contained" color="secondary">
            Register
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
