import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Alert, Box, Button, Card, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import patientService from '../../services/patientService';

const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  phone: yup.string().nullable(),
  gender: yup.string().nullable(),
  dateOfBirth: yup.string().nullable(),
  bloodGroup: yup.string().nullable(),
  address: yup.string().nullable(),
  emergencyContactName: yup.string().nullable(),
  emergencyContactPhone: yup.string().nullable(),
  allergies: yup.string().nullable(),
  chronicConditions: yup.string().nullable(),
});

const emptyValues = {
  firstName: '', lastName: '', email: '', phone: '', gender: '', dateOfBirth: '',
  bloodGroup: '', address: '', emergencyContactName: '', emergencyContactPhone: '',
  allergies: '', chronicConditions: '',
};

export default function ReceptionistRegisterPatientPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [registered, setRegistered] = useState(null);

  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm({ resolver: yupResolver(schema), defaultValues: emptyValues });

  const onSubmit = async (values) => {
    try {
      const patient = await patientService.register(values);
      enqueueSnackbar('Patient registered', { variant: 'success' });
      setRegistered(patient);
      reset(emptyValues);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not register this patient', { variant: 'error' });
    }
  };

  return (
    <Box>
      <PageHeader title="Register Patient" subtitle="Create a new patient record and account at the front desk." />

      {registered && (
        <Alert icon={<CheckCircleOutlineIcon />} severity="success" sx={{ mb: 3 }} onClose={() => setRegistered(null)}>
          {registered.firstName} {registered.lastName} has been registered. They can now book appointments.
        </Alert>
      )}

      <Card sx={{ p: 3, maxWidth: 720 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2.5 }}>Basic Information</Typography>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField label="First name" fullWidth {...register('firstName')} error={Boolean(errors.firstName)} helperText={errors.firstName?.message} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Last name" fullWidth {...register('lastName')} error={Boolean(errors.lastName)} helperText={errors.lastName?.message} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Email" type="email" fullWidth {...register('email')} error={Boolean(errors.email)} helperText={errors.email?.message || 'A temporary password is generated and emailed'} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Phone" fullWidth {...register('phone')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Gender" fullWidth>
                    <MenuItem value="">—</MenuItem>
                    <MenuItem value="MALE">Male</MenuItem>
                    <MenuItem value="FEMALE">Female</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Date of birth" type="date" fullWidth InputLabelProps={{ shrink: true }} {...register('dateOfBirth')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Blood group" fullWidth {...register('bloodGroup')} placeholder="O+" />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Address" fullWidth {...register('address')} />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 1 }}>Emergency Contact</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Contact name" fullWidth {...register('emergencyContactName')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Contact phone" fullWidth {...register('emergencyContactPhone')} />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 1 }}>Medical Background</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Allergies" fullWidth multiline minRows={2} {...register('allergies')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Chronic conditions" fullWidth multiline minRows={2} {...register('chronicConditions')} />
            </Grid>

            <Grid item xs={12}>
              <Stack direction="row" spacing={2}>
                <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                  {isSubmitting ? 'Registering…' : 'Register Patient'}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Card>
    </Box>
  );
}
