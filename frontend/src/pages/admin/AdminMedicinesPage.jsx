import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, IconButton, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import medicineService from '../../services/medicineService';

const medicineSchema = yup.object({
  name: yup.string().required('Name is required'),
  genericName: yup.string().nullable(),
  manufacturer: yup.string().nullable(),
  category: yup.string().nullable(),
  unit: yup.string().nullable(),
  unitPrice: yup.number().typeError('Enter a number').min(0).required('Unit price is required'),
  description: yup.string().nullable(),
  initialStock: yup.number().typeError('Enter a number').min(0).nullable(),
  reorderLevel: yup.number().typeError('Enter a number').min(0).nullable(),
});

const stockSchema = yup.object({
  quantity: yup.number().typeError('Enter a number').required('Quantity is required'),
  batchNumber: yup.string().nullable(),
  expiryDate: yup.string().nullable(),
});

const emptyMedicine = {
  name: '', genericName: '', manufacturer: '', category: '', unit: '',
  unitPrice: '', description: '', initialStock: '', reorderLevel: '',
};

export default function AdminMedicinesPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stockDialogTarget, setStockDialogTarget] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const medicineForm = useForm({ resolver: yupResolver(medicineSchema), defaultValues: emptyMedicine });
  const stockForm = useForm({ resolver: yupResolver(stockSchema), defaultValues: { quantity: '', batchNumber: '', expiryDate: '' } });

  const loadData = async () => {
    setLoading(true);
    try {
      setRows(await medicineService.getAll());
    } catch {
      enqueueSnackbar('Could not load medicines', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => { setEditing(null); medicineForm.reset(emptyMedicine); setDialogOpen(true); };
  const openEdit = (row) => {
    setEditing(row);
    medicineForm.reset({
      name: row.name, genericName: row.genericName ?? '', manufacturer: row.manufacturer ?? '',
      category: row.category ?? '', unit: row.unit ?? '', unitPrice: row.unitPrice ?? '',
      description: row.description ?? '', initialStock: '', reorderLevel: row.reorderLevel ?? '',
    });
    setDialogOpen(true);
  };

  const onSubmitMedicine = async (values) => {
    try {
      if (editing) {
        await medicineService.update(editing.id, values);
        enqueueSnackbar('Medicine updated', { variant: 'success' });
      } else {
        await medicineService.create(values);
        enqueueSnackbar('Medicine added to catalog', { variant: 'success' });
      }
      setDialogOpen(false);
      loadData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Something went wrong', { variant: 'error' });
    }
  };

  const openStockDialog = (row) => {
    setStockDialogTarget(row);
    stockForm.reset({ quantity: '', batchNumber: '', expiryDate: '' });
  };

  const onSubmitStock = async (values) => {
    try {
      await medicineService.adjustStock(stockDialogTarget.id, values);
      enqueueSnackbar('Stock updated', { variant: 'success' });
      setStockDialogTarget(null);
      loadData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not update stock', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await medicineService.remove(deleteTarget.id);
      enqueueSnackbar('Medicine removed', { variant: 'success' });
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not remove this medicine', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      field: 'name', headerName: 'Medicine', flex: 1.3, minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} noWrap>{params.row.name}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap>{params.row.genericName}</Typography>
        </Box>
      ),
    },
    { field: 'category', headerName: 'Category', flex: 0.8, minWidth: 120 },
    {
      field: 'unitPrice', headerName: 'Price', width: 90,
      renderCell: (p) => <Typography variant="body2" sx={{ fontFamily: '"IBM Plex Mono", monospace' }}>${Number(p.value ?? 0).toFixed(2)}</Typography>,
    },
    {
      field: 'quantityInStock', headerName: 'In Stock', width: 130,
      renderCell: (p) => (
        <Chip
          label={`${p.value ?? 0} units`}
          size="small"
          color={p.row.lowStock ? 'error' : 'success'}
          variant={p.row.lowStock ? 'filled' : 'outlined'}
        />
      ),
    },
    {
      field: 'actions', headerName: '', width: 150, sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Adjust stock">
            <IconButton size="small" onClick={() => openStockDialog(params.row)}><Inventory2OutlinedIcon fontSize="small" /></IconButton>
          </Tooltip>
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
        title="Medicines & Inventory"
        subtitle="Manage the medicine catalog and track stock levels."
        actionLabel="Add Medicine"
        actionIcon={<AddOutlinedIcon />}
        onAction={openCreate}
      />

      <Card sx={{ p: loading ? 3 : 0 }}>
        {loading ? (
          <TableSkeleton rows={6} columns={5} />
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

      {/* Medicine create/edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Medicine' : 'Add Medicine'}</DialogTitle>
        <Box component="form" onSubmit={medicineForm.handleSubmit(onSubmitMedicine)} noValidate>
          <DialogContent>
            <Grid container spacing={2.5} sx={{ mt: 0.25 }}>
              <Grid item xs={12} sm={6}>
                <TextField label="Name" fullWidth {...medicineForm.register('name')} error={Boolean(medicineForm.formState.errors.name)} helperText={medicineForm.formState.errors.name?.message} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Generic name" fullWidth {...medicineForm.register('genericName')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Manufacturer" fullWidth {...medicineForm.register('manufacturer')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Category" fullWidth {...medicineForm.register('category')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Unit (e.g. tablet, ml)" fullWidth {...medicineForm.register('unit')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Unit price ($)" type="number" fullWidth {...medicineForm.register('unitPrice')} error={Boolean(medicineForm.formState.errors.unitPrice)} helperText={medicineForm.formState.errors.unitPrice?.message} />
              </Grid>
              {!editing && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Initial stock" type="number" fullWidth {...medicineForm.register('initialStock')} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Reorder level" type="number" fullWidth {...medicineForm.register('reorderLevel')} />
                  </Grid>
                </>
              )}
              <Grid item xs={12}>
                <TextField label="Description" fullWidth multiline minRows={2} {...medicineForm.register('description')} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={medicineForm.formState.isSubmitting}>
              {medicineForm.formState.isSubmitting ? 'Saving…' : editing ? 'Save Changes' : 'Add Medicine'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Stock adjustment dialog */}
      <Dialog open={Boolean(stockDialogTarget)} onClose={() => setStockDialogTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Adjust Stock — {stockDialogTarget?.name}</DialogTitle>
        <Box component="form" onSubmit={stockForm.handleSubmit(onSubmitStock)} noValidate>
          <DialogContent>
            <Stack spacing={2.5}>
              <TextField
                label="Quantity (+ to restock, − to deduct)" type="number" fullWidth autoFocus
                {...stockForm.register('quantity')}
                error={Boolean(stockForm.formState.errors.quantity)}
                helperText={stockForm.formState.errors.quantity?.message}
              />
              <TextField label="Batch number" fullWidth {...stockForm.register('batchNumber')} />
              <TextField label="Expiry date" type="date" fullWidth InputLabelProps={{ shrink: true }} {...stockForm.register('expiryDate')} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setStockDialogTarget(null)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={stockForm.formState.isSubmitting}>
              {stockForm.formState.isSubmitting ? 'Updating…' : 'Update Stock'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Remove medicine?"
        message={<>This removes <strong>{deleteTarget?.name}</strong> from the catalog. This can't be undone.</>}
        confirmLabel="Remove"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
