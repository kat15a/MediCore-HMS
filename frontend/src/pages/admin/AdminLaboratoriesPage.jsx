import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, IconButton, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import laboratoryService from '../../services/laboratoryService';

const schema = yup.object({
  testName: yup.string().required('Test name is required'),
  category: yup.string().nullable(),
  price: yup.number().typeError('Enter a number').min(0).required('Price is required'),
  description: yup.string().nullable(),
});

const emptyValues = { testName: '', category: '', price: '', description: '' };

export default function AdminLaboratoriesPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm({ resolver: yupResolver(schema), defaultValues: emptyValues });

  const loadData = async () => {
    setLoading(true);
    try {
      setRows(await laboratoryService.getAll());
    } catch {
      enqueueSnackbar('Could not load lab tests', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => { setEditing(null); reset(emptyValues); setDialogOpen(true); };
  const openEdit = (row) => {
    setEditing(row);
    reset({ testName: row.testName, category: row.category ?? '', price: row.price ?? '', description: row.description ?? '' });
    setDialogOpen(true);
  };

  const onSubmit = async (values) => {
    try {
      if (editing) {
        await laboratoryService.update(editing.id, values);
        enqueueSnackbar('Lab test updated', { variant: 'success' });
      } else {
        await laboratoryService.create(values);
        enqueueSnackbar('Lab test added to catalog', { variant: 'success' });
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
      await laboratoryService.remove(deleteTarget.id);
      enqueueSnackbar('Lab test removed', { variant: 'success' });
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not remove this test', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { field: 'testName', headerName: 'Test Name', flex: 1.4, minWidth: 200 },
    { field: 'category', headerName: 'Category', flex: 1, minWidth: 140 },
    {
      field: 'price', headerName: 'Price', width: 100,
      renderCell: (p) => <Typography variant="body2" sx={{ fontFamily: '"IBM Plex Mono", monospace' }}>${Number(p.value ?? 0).toFixed(2)}</Typography>,
    },
    {
      field: 'actions', headerName: '', width: 110, sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(params.row)}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Remove"><IconButton size="small" onClick={() => setDeleteTarget(params.row)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Laboratories"
        subtitle="Manage the lab test catalog offered across the hospital."
        actionLabel="Add Test"
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
        <DialogTitle>{editing ? 'Edit Lab Test' : 'Add Lab Test'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent>
            <Grid container spacing={2.5} sx={{ mt: 0.25 }}>
              <Grid item xs={12}>
                <TextField label="Test name" fullWidth {...register('testName')} error={Boolean(errors.testName)} helperText={errors.testName?.message} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Category" fullWidth {...register('category')} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Price ($)" type="number" fullWidth {...register('price')} error={Boolean(errors.price)} helperText={errors.price?.message} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Description" fullWidth multiline minRows={2} {...register('description')} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : editing ? 'Save Changes' : 'Add Test'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Remove lab test?"
        message={<>This removes <strong>{deleteTarget?.testName}</strong> from the catalog. This can't be undone.</>}
        confirmLabel="Remove"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
