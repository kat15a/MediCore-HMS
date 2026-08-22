import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Alert, Box, Button, Link, Stack, TextField, Typography } from '@mui/material';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import authService from '../../services/authService';

const schema = yup.object({
  email: yup.string().email('Enter a valid email address').required('Email is required'),
});

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema), defaultValues: { email: '' } });

  const onSubmit = async ({ email }) => {
    setServerError('');
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  if (sent) {
    return (
      <Stack spacing={2} alignItems="center" textAlign="center">
        <MarkEmailReadOutlinedIcon sx={{ fontSize: 48, color: 'secondary.main' }} />
        <Typography variant="h5">Check your inbox</Typography>
        <Typography variant="body2" color="text.secondary">
          If an account exists for that email, we've sent a link to reset your password. It expires in 1 hour.
        </Typography>
        <Link component={RouterLink} to="/login" fontWeight={600} sx={{ mt: 1 }}>
          Back to log in
        </Link>
      </Stack>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>Forgot your password?</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Enter the email on your account and we'll send you a reset link.
      </Typography>

      {serverError && <Alert severity="error" sx={{ mb: 3 }}>{serverError}</Alert>}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2.5}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            autoFocus
            {...register('email')}
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
          />
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Send Reset Link'}
          </Button>
        </Stack>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
        <Link component={RouterLink} to="/login" fontWeight={600}>
          Back to log in
        </Link>
      </Typography>
    </Box>
  );
}
