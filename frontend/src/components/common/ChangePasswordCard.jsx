import { useState } from 'react';
import { Box, Button, Card, Stack, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSnackbar } from 'notistack';
import authService from '../../services/authService';

const schema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup.string().min(8, 'At least 8 characters').required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords do not match')
    .required('Please confirm your new password'),
});

export default function ChangePasswordCard() {
  const { enqueueSnackbar } = useSnackbar();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm({ resolver: yupResolver(schema), defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } });

  const onSubmit = async ({ currentPassword, newPassword }) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
      enqueueSnackbar('Password changed successfully', { variant: 'success' });
      reset();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not change your password', { variant: 'error' });
    }
  };

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>Change Password</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Changing your password signs you out of all other sessions.
      </Typography>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2.5} sx={{ maxWidth: 380 }}>
          <TextField label="Current password" type="password" fullWidth {...register('currentPassword')} error={Boolean(errors.currentPassword)} helperText={errors.currentPassword?.message} />
          <TextField label="New password" type="password" fullWidth {...register('newPassword')} error={Boolean(errors.newPassword)} helperText={errors.newPassword?.message} />
          <TextField label="Confirm new password" type="password" fullWidth {...register('confirmPassword')} error={Boolean(errors.confirmPassword)} helperText={errors.confirmPassword?.message} />
          <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ alignSelf: 'flex-start' }}>
            {isSubmitting ? 'Updating…' : 'Update Password'}
          </Button>
        </Stack>
      </Box>
    </Card>
  );
}
