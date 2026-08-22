import { useEffect, useState } from 'react';
import { Box, Button, Card, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import ChangePasswordCard from '../../components/common/ChangePasswordCard';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import useAuth from '../../hooks/useAuth';
import patientService from '../../services/patientService';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function PatientProfilePage() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  useEffect(() => {
    if (!user?.profileId) return;
    patientService
      .getById(user.profileId)
      .then((p) => reset({
        phone: p.phone ?? '',
        bloodGroup: p.bloodGroup ?? '',
        heightCm: p.heightCm ?? '',
        weightKg: p.weightKg ?? '',
        address: p.address ?? '',
        emergencyContactName: p.emergencyContactName ?? '',
        emergencyContactPhone: p.emergencyContactPhone ?? '',
        allergies: p.allergies ?? '',
        chronicConditions: p.chronicConditions ?? '',
        insuranceProvider: p.insuranceProvider ?? '',
        insurancePolicyNo: p.insurancePolicyNo ?? '',
      }))
      .catch(() => enqueueSnackbar('Could not load your profile', { variant: 'error' }))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.profileId]);

  const onSubmit = async (values) => {
    try {
      await patientService.update(user.profileId, values);
      enqueueSnackbar('Profile updated', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not update your profile', { variant: 'error' });
    }
  };

  if (loading) {
    return (
      <Box>
        <PageHeader title="My Profile" subtitle="Keep your medical and contact details up to date." />
        <CardSkeleton count={2} />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="My Profile" subtitle="Keep your medical and contact details up to date." />
      <Stack spacing={3}>
        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2.5 }}>Medical & Contact Details</Typography>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}><TextField label="Phone" fullWidth {...register('phone')} /></Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="bloodGroup" control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Blood group" fullWidth>
                      <MenuItem value="">—</MenuItem>
                      {BLOOD_GROUPS.map((bg) => <MenuItem key={bg} value={bg}>{bg}</MenuItem>)}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}><TextField label="Height (cm)" type="number" fullWidth {...register('heightCm')} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Weight (kg)" type="number" fullWidth {...register('weightKg')} /></Grid>
              <Grid item xs={12}><TextField label="Address" fullWidth {...register('address')} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Emergency contact name" fullWidth {...register('emergencyContactName')} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Emergency contact phone" fullWidth {...register('emergencyContactPhone')} /></Grid>
              <Grid item xs={12}><TextField label="Allergies" fullWidth multiline minRows={2} {...register('allergies')} /></Grid>
              <Grid item xs={12}><TextField label="Chronic conditions" fullWidth multiline minRows={2} {...register('chronicConditions')} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Insurance provider" fullWidth {...register('insuranceProvider')} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Insurance policy number" fullWidth {...register('insurancePolicyNo')} /></Grid>
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
