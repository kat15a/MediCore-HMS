import { useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Alert, Box, Button, IconButton, InputAdornment, Link, Stack, TextField, Typography } from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useSnackbar } from 'notistack';
import authService from '../../services/authService';

const schema = yup.object({
  newPassword: yup.string().min(8, 'At least 8 characters').required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords do not match')
    .required('Please confirm your new password'),
});

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema), defaultValues: { newPassword: '', confirmPassword: '' } });

  const onSubmit = async ({ newPassword }) => {
    setServerError('');
    try {
      await authService.resetPassword(token, newPassword);
      setDone(true);
      enqueueSnackbar('Password reset successfully', { variant: 'success' });
    } catch (err) {
      setServerError(err.response?.data?.message || 'This reset link is invalid or has expired.');
    }
  };

  if (!token) {
    return (
      <Alert severity="error">
        This reset link is missing its token. Please request a new one from the{' '}
        <Link component={RouterLink} to="/forgot-password">forgot password</Link> page.
      </Alert>
    );
  }

  if (done) {
    return (
      <Stack spacing={2} alignItems="center" textAlign="center">
        <CheckCircleOutlineIcon sx={{ fontSize: 48, color: 'secondary.main' }} />
        <Typography variant="h5">Password updated</Typography>
        <Typography variant="body2" color="text.secondary">
          You can now log in with your new password.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/login')} sx={{ mt: 2 }}>
          Go to Log In
        </Button>
      </Stack>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>Set a new password</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Choose a strong password you haven't used before.
      </Typography>

      {serverError && <Alert severity="error" sx={{ mb: 3 }}>{serverError}</Alert>}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2.5}>
          <TextField
            label="New password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            autoFocus
            {...register('newPassword')}
            error={Boolean(errors.newPassword)}
            helperText={errors.newPassword?.message}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword((s) => !s)} edge="end" tabIndex={-1}>
                    {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Confirm new password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            {...register('confirmPassword')}
            error={Boolean(errors.confirmPassword)}
            helperText={errors.confirmPassword?.message}
          />
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
            {isSubmitting ? 'Updating…' : 'Update Password'}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
