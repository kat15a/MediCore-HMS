import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Avatar, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, IconButton, MenuItem, Stack, Switch, TextField, Tooltip, Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import doctorService from '../../services/doctorService';
import departmentService from '../../services/departmentService';

const createSchema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  phone: yup.string().nullable(),
  departmentId: yup.number().typeError('Select a department').required('Select a department'),
  specialization: yup.string().nullable(),
  qualification: yup.string().nullable(),
  licenseNumber: yup.string().nullable(),
  yearsOfExperience: yup.number().typeError('Enter a number').min(0).nullable(),
  consultationFee: yup.number().typeError('Enter a number').min(0).nullable(),
});

const emptyValues = {
  firstName: '', lastName: '', email: '', phone: '', departmentId: '',
  specialization: '', qualification: '', licenseNumber: '', yearsOfExperience: '', consultationFee: '',
};

export default function AdminDoctorsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(createSchema), defaultValues: emptyValues });

  const loadData = async () => {
    setLoading(true);
    try {
      const [doctorPage, deptList] = await Promise.all([
        doctorService.getAll({ size: 100 }),
        departmentService.getAll(),
      ]);
      setRows(doctorPage.content);
      setDepartments(deptList);
    } catch {
      enqueueSnackbar('Could not load doctors', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    reset(emptyValues);
    setDialogOpen(true);
  };

  const openEdit = (doctor) => {
    setEditing(doctor);
    reset({
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      email: doctor.email,
      phone: doctor.phone ?? '',
      departmentId: doctor.departmentId,
      specialization: doctor.specialization ?? '',
      qualification: doctor.qualification ?? '',
      licenseNumber: doctor.licenseNumber ?? '',
      yearsOfExperience: doctor.yearsOfExperience ?? '',
      consultationFee: doctor.consultationFee ?? '',
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values) => {
    try {
      if (editing) {
        await doctorService.update(editing.id, values);
        enqueueSnackbar('Doctor updated', { variant: 'success' });
      } else {
        await doctorService.create(values);
        enqueueSnackbar('Doctor created — a welcome email has been sent', { variant: 'success' });
      }
      setDialogOpen(false);
      loadData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Something went wrong', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await doctorService.remove(deleteTarget.id);
      enqueueSnackbar('Doctor removed', { variant: 'success' });
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not remove this doctor', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const toggleAvailability = async (doctor) => {
    try {
      await doctorService.setAvailability(doctor.id, !doctor.isAvailable);
      setRows((prev) => prev.map((r) => (r.id === doctor.id ? { ...r, isAvailable: !r.isAvailable } : r)));
    } catch {
      enqueueSnackbar('Could not update availability', { variant: 'error' });
    }
  };

  const columns = [
    {
      field: 'firstName',
      headerName: 'Doctor',
      flex: 1.4,
      minWidth: 200,
      renderCell: (params) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: 'primary.main' }}>
            {params.row.firstName?.[0]}{params.row.lastName?.[0]}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>Dr. {params.row.firstName} {params.row.lastName}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>{params.row.email}</Typography>
          </Box>
        </Stack>
      ),
    },
    { field: 'departmentName', headerName: 'Department', flex: 1, minWidth: 140 },
    { field: 'specialization', headerName: 'Specialization', flex: 1, minWidth: 140 },
    {
      field: 'consultationFee',
      headerName: 'Fee',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontFamily: '"IBM Plex Mono", monospace' }}>
          ${Number(params.value ?? 0).toFixed(0)}
        </Typography>
      ),
    },
    {
      field: 'isAvailable',
      headerName: 'Available',
      width: 110,
      renderCell: (params) => (
        <Switch checked={Boolean(params.value)} size="small" onChange={() => toggleAvailability(params.row)} />
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 110,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEdit(params.row)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Remove">
            <IconButton size="small" onClick={() => setDeleteTarget(params.row)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Doctors"
        subtitle="Manage doctor profiles and their linked staff accounts."
        actionLabel="Add Doctor"
        actionIcon={<AddOutlinedIcon />}
        onAction={openCreate}
      />

      <Card sx={{ p: loading ? 3 : 0 }}>
        {loading ? (
          <TableSkeleton rows={6} columns={6} />
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            autoHeight
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            sx={{ border: 'none' }}
          />
        )}
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Doctor' : 'Add Doctor'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent>
            <Grid container spacing={2.5} sx={{ mt: 0.25 }}>
              <Grid item xs={6}>
                <TextField label="First name" fullWidth {...register('firstName')} error={Boolean(errors.firstName)} helperText={errors.firstName?.message} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Last name" fullWidth {...register('lastName')} error={Boolean(errors.lastName)} helperText={errors.lastName?.message} />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Email" type="email" fullWidth disabled={Boolean(editing)}
                  {...register('email')} error={Boolean(errors.email)} helperText={errors.email?.message || (editing ? "Email can't be changed" : 'A temporary password is generated and emailed')}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Phone" fullWidth {...register('phone')} />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name="departmentId"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Department" fullWidth error={Boolean(errors.departmentId)} helperText={errors.departmentId?.message}>
                      {departments.map((d) => (
                        <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Specialization" fullWidth {...register('specialization')} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Qualification" fullWidth {...register('qualification')} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="License number" fullWidth {...register('licenseNumber')} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Years of experience" type="number" fullWidth {...register('yearsOfExperience')} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Consultation fee ($)" type="number" fullWidth {...register('consultationFee')} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : editing ? 'Save Changes' : 'Create Doctor'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Remove doctor?"
        message={<>This deletes <strong>Dr. {deleteTarget?.firstName} {deleteTarget?.lastName}</strong> and their staff account. This can't be undone.</>}
        confirmLabel="Remove"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
