import { useEffect, useState } from 'react';
import { Box, Button, Card, Grid, Stack, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import ChangePasswordCard from '../../components/common/ChangePasswordCard';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import useAuth from '../../hooks/useAuth';
import doctorService from '../../services/doctorService';

export default function DoctorProfilePage() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  useEffect(() => {
    if (!user?.profileId) return;
    doctorService
      .getById(user.profileId)
      .then((d) => reset({
        specialization: d.specialization ?? '',
        qualification: d.qualification ?? '',
        licenseNumber: d.licenseNumber ?? '',
        yearsOfExperience: d.yearsOfExperience ?? '',
        consultationFee: d.consultationFee ?? '',
        bio: d.bio ?? '',
        phone: d.phone ?? '',
      }))
      .catch(() => enqueueSnackbar('Could not load your profile', { variant: 'error' }))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.profileId]);

  const onSubmit = async (values) => {
    try {
      await doctorService.update(user.profileId, values);
      enqueueSnackbar('Profile updated', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not update your profile', { variant: 'error' });
    }
  };

  if (loading) {
    return (
      <Box>
        <PageHeader title="My Profile" subtitle="Manage your public profile and consultation details." />
        <CardSkeleton count={2} />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="My Profile" subtitle="Manage your public profile and consultation details." />
      <Stack spacing={3}>
        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2.5 }}>Professional Details</Typography>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}><TextField label="Specialization" fullWidth {...register('specialization')} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Qualification" fullWidth {...register('qualification')} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="License number" fullWidth {...register('licenseNumber')} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Years of experience" type="number" fullWidth {...register('yearsOfExperience')} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Consultation fee ($)" type="number" fullWidth {...register('consultationFee')} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Phone" fullWidth {...register('phone')} /></Grid>
              <Grid item xs={12}><TextField label="Bio" fullWidth multiline minRows={3} {...register('bio')} /></Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save Changes'}</Button>
              </Grid>
            </Grid>
          </Box>
        </Card>

        <ChangePasswordCard />
      </Stack>
    </Box>
  );
}
