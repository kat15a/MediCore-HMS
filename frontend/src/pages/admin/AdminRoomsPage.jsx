import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, IconButton, MenuItem, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import roomService from '../../services/roomService';

const schema = yup.object({
  roomNumber: yup.string().required('Room number is required'),
  roomType: yup.string().required('Select a room type'),
  floor: yup.string().nullable(),
  capacity: yup.number().typeError('Enter a number').min(1, 'At least 1').required('Capacity is required'),
  dailyRate: yup.number().typeError('Enter a number').min(0).required('Daily rate is required'),
});

const emptyValues = { roomNumber: '', roomType: 'GENERAL', floor: '', capacity: 1, dailyRate: '' };

const STATUS_COLOR = { AVAILABLE: 'success', OCCUPIED: 'warning', MAINTENANCE: 'default' };

export default function AdminRoomsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm({ resolver: yupResolver(schema), defaultValues: emptyValues });

  const loadData = async () => {
    setLoading(true);
    try {
      setRows(await roomService.getAll());
    } catch {
      enqueueSnackbar('Could not load rooms', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => { setEditing(null); reset(emptyValues); setDialogOpen(true); };
  const openEdit = (row) => {
    setEditing(row);
    reset({ roomNumber: row.roomNumber, roomType: row.roomType, floor: row.floor ?? '', capacity: row.capacity, dailyRate: row.dailyRate });
    setDialogOpen(true);
  };

  const onSubmit = async (values) => {
    try {
      if (editing) {
        await roomService.update(editing.id, values);
        enqueueSnackbar('Room updated', { variant: 'success' });
      } else {
        await roomService.create(values);
        enqueueSnackbar('Room added', { variant: 'success' });
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
      await roomService.remove(deleteTarget.id);
      enqueueSnackbar('Room removed', { variant: 'success' });
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not remove this room', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const handleAllocate = async (row) => {
    try {
      await roomService.allocate(row.id);
      enqueueSnackbar('Bed allocated', { variant: 'success' });
      loadData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'No beds available in this room', { variant: 'error' });
    }
  };

  const handleRelease = async (row) => {
    try {
      await roomService.release(row.id);
      enqueueSnackbar('Bed released', { variant: 'success' });
      loadData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not release a bed', { variant: 'error' });
    }
  };

  const columns = [
    { field: 'roomNumber', headerName: 'Room', width: 110 },
    { field: 'roomType', headerName: 'Type', flex: 1, minWidth: 150 },
    { field: 'floor', headerName: 'Floor', width: 90 },
    {
      field: 'occupiedBeds', headerName: 'Beds', width: 130,
      renderCell: (p) => <Typography variant="body2" sx={{ fontFamily: '"IBM Plex Mono", monospace' }}>{p.row.occupiedBeds}/{p.row.capacity} occupied</Typography>,
    },
    {
      field: 'dailyRate', headerName: 'Daily Rate', width: 110,
      renderCell: (p) => <Typography variant="body2" sx={{ fontFamily: '"IBM Plex Mono", monospace' }}>${Number(p.value ?? 0).toFixed(0)}</Typography>,
    },
    {
      field: 'status', headerName: 'Status', width: 130,
      renderCell: (p) => <Chip label={p.value} size="small" color={STATUS_COLOR[p.value]} variant={p.value === 'MAINTENANCE' ? 'outlined' : 'filled'} />,
    },
    {
      field: 'actions', headerName: '', width: 180, sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Allocate a bed">
            <span><IconButton size="small" onClick={() => handleAllocate(params.row)} disabled={params.row.availableBeds <= 0}><PersonAddOutlinedIcon fontSize="small" /></IconButton></span>
          </Tooltip>
          <Tooltip title="Release a bed">
            <span><IconButton size="small" onClick={() => handleRelease(params.row)} disabled={params.row.occupiedBeds <= 0}><PersonRemoveOutlinedIcon fontSize="small" /></IconButton></span>
          </Tooltip>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(params.row)}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Remove"><IconButton size="small" onClick={() => setDeleteTarget(params.row)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Rooms & Beds"
        subtitle="Manage room inventory and bed allocation."
        actionLabel="Add Room"
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
        <DialogTitle>{editing ? 'Edit Room' : 'Add Room'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent>
            <Grid container spacing={2.5} sx={{ mt: 0.25 }}>
              <Grid item xs={6}>
                <TextField label="Room number" fullWidth {...register('roomNumber')} error={Boolean(errors.roomNumber)} helperText={errors.roomNumber?.message} />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name="roomType"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Room type" fullWidth error={Boolean(errors.roomType)} helperText={errors.roomType?.message}>
                      <MenuItem value="GENERAL">General</MenuItem>
                      <MenuItem value="PRIVATE">Private</MenuItem>
                      <MenuItem value="ICU">ICU</MenuItem>
                      <MenuItem value="OPERATION_THEATRE">Operation Theatre</MenuItem>
                      <MenuItem value="EMERGENCY">Emergency</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Floor" fullWidth {...register('floor')} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Capacity (beds)" type="number" fullWidth {...register('capacity')} error={Boolean(errors.capacity)} helperText={errors.capacity?.message} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Daily rate ($)" type="number" fullWidth {...register('dailyRate')} error={Boolean(errors.dailyRate)} helperText={errors.dailyRate?.message} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : editing ? 'Save Changes' : 'Add Room'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Remove room?"
        message={<>This removes room <strong>{deleteTarget?.roomNumber}</strong>. This can't be undone.</>}
        confirmLabel="Remove"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
