import { useEffect, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import authService from '../../services/authService';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('This verification link is missing its token.');
      return;
    }
    authService
      .verifyEmail(token)
      .then((msg) => {
        setStatus('success');
        setMessage(msg || 'Email verified successfully.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'This verification link is invalid or has expired.');
      });
  }, [token]);

  if (status === 'verifying') {
    return (
      <Stack spacing={2} alignItems="center" textAlign="center" sx={{ py: 4 }}>
        <CircularProgress color="primary" />
        <Typography color="text.secondary">Verifying your email…</Typography>
      </Stack>
    );
  }

  return (
    <Box>
      <Stack spacing={2} alignItems="center" textAlign="center">
        {status === 'success' ? (
          <CheckCircleOutlineIcon sx={{ fontSize: 48, color: 'secondary.main' }} />
        ) : (
          <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.main' }} />
        )}
        <Typography variant="h5">{status === 'success' ? 'Email verified' : 'Verification failed'}</Typography>
        {status === 'error' && <Alert severity="error" sx={{ width: '100%' }}>{message}</Alert>}
        {status === 'success' && <Typography color="text.secondary">{message}</Typography>}
        <Button component={RouterLink} to="/login" variant="contained" sx={{ mt: 2 }}>
          Go to Log In
        </Button>
      </Stack>
    </Box>
  );
}
