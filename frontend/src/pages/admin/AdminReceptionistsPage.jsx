import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Avatar, Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, IconButton, MenuItem, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import receptionistService from '../../services/receptionistService';

const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  phone: yup.string().nullable(),
  deskNumber: yup.string().nullable(),
  shift: yup.string().required('Select a shift'),
});

const emptyValues = { firstName: '', lastName: '', email: '', phone: '', deskNumber: '', shift: 'MORNING' };

export default function AdminReceptionistsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register, control, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema), defaultValues: emptyValues });

  const loadData = async () => {
    setLoading(true);
    try {
      const page = await receptionistService.getAll({ size: 100 });
      setRows(page.content);
    } catch {
      enqueueSnackbar('Could not load receptionists', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => { setEditing(null); reset(emptyValues); setDialogOpen(true); };
  const openEdit = (row) => {
    setEditing(row);
    reset({
      firstName: row.firstName, lastName: row.lastName, email: row.email,
      phone: row.phone ?? '', deskNumber: row.deskNumber ?? '', shift: row.shift ?? 'MORNING',
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values) => {
    try {
      if (editing) {
        await receptionistService.update(editing.id, values);
        enqueueSnackbar('Receptionist updated', { variant: 'success' });
      } else {
        await receptionistService.create(values);
        enqueueSnackbar('Receptionist created — a welcome email has been sent', { variant: 'success' });
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
      await receptionistService.remove(deleteTarget.id);
      enqueueSnackbar('Receptionist removed', { variant: 'success' });
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not remove this receptionist', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      field: 'firstName', headerName: 'Receptionist', flex: 1.4, minWidth: 200,
      renderCell: (params) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: 'secondary.main' }}>
            {params.row.firstName?.[0]}{params.row.lastName?.[0]}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>{params.row.firstName} {params.row.lastName}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>{params.row.email}</Typography>
          </Box>
        </Stack>
      ),
    },
    { field: 'deskNumber', headerName: 'Desk', width: 100 },
    { field: 'shift', headerName: 'Shift', width: 120 },
    { field: 'phone', headerName: 'Phone', flex: 1, minWidth: 130 },
    {
      field: 'actions', headerName: '', width: 110, sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEdit(params.row)}><EditOutlinedIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title="Remove">
            <IconButton size="small" onClick={() => setDeleteTarget(params.row)}><DeleteOutlineIcon fontSize="small" /></IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Receptionists"
        subtitle="Manage front-desk staff accounts."
        actionLabel="Add Receptionist"
        actionIcon={<AddOutlinedIcon />}
        onAction={openCreate}
      />

      <Card sx={{ p: loading ? 3 : 0 }}>
        {loading ? (
          <TableSkeleton rows={6} columns={4} />
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
        <DialogTitle>{editing ? 'Edit Receptionist' : 'Add Receptionist'}</DialogTitle>
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
                  {...register('email')} error={Boolean(errors.email)}
                  helperText={errors.email?.message || (editing ? "Email can't be changed" : 'A temporary password is generated and emailed')}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Phone" fullWidth {...register('phone')} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Desk number" fullWidth {...register('deskNumber')} />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name="shift"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Shift" fullWidth error={Boolean(errors.shift)} helperText={errors.shift?.message}>
                      <MenuItem value="MORNING">Morning</MenuItem>
                      <MenuItem value="EVENING">Evening</MenuItem>
                      <MenuItem value="NIGHT">Night</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : editing ? 'Save Changes' : 'Create Receptionist'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Remove receptionist?"
        message={<>This deletes <strong>{deleteTarget?.firstName} {deleteTarget?.lastName}</strong> and their staff account. This can't be undone.</>}
        confirmLabel="Remove"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
