import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PulseLine from '../../components/common/PulseLine';

export default function NotFoundPage() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', bgcolor: 'background.default' }}>
      <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
        <Stack spacing={3} alignItems="center">
          <Typography
            variant="h1"
            sx={{ fontSize: 96, fontFamily: '"IBM Plex Mono", monospace', color: 'primary.main', lineHeight: 1 }}
          >
            404
          </Typography>
          <PulseLine height={32} sx={{ width: 160 }} />
          <Typography variant="h5">This page flatlined.</Typography>
          <Typography color="text.secondary">
            The page you're looking for doesn't exist or may have moved.
          </Typography>
          <Button component={RouterLink} to="/" variant="contained" startIcon={<ArrowBackIcon />}>
            Back to Home
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
