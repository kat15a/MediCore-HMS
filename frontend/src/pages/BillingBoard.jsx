import { useEffect, useState } from 'react';
import {
  Autocomplete, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, Grid, IconButton, MenuItem, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import { useSnackbar } from 'notistack';
import PageHeader from '../components/common/PageHeader';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import billingService from '../services/billingService';
import patientService from '../services/patientService';

const ITEM_TYPES = ['CONSULTATION', 'MEDICINE', 'LAB_TEST', 'ROOM_CHARGE', 'PROCEDURE', 'OTHER'];
const PAYMENT_METHODS = ['CASH', 'CARD', 'UPI', 'NET_BANKING', 'INSURANCE'];
const STATUS_COLOR = { PENDING: 'warning', PARTIALLY_PAID: 'info', PAID: 'success', CANCELLED: 'default' };

const emptyItem = { itemType: 'CONSULTATION', description: '', quantity: 1, unitPrice: '' };

export default function BillingBoard({ subtitle }) {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [patientOptions, setPatientOptions] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [taxAmount, setTaxAmount] = useState('0');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  const [detailBill, setDetailBill] = useState(null);
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [payingLoading, setPayingLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const page = await billingService.getAll({ size: 100, sort: 'createdAt,desc' });
      setRows(page.content);
    } catch {
      enqueueSnackbar('Could not load bills', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const searchPatients = async (query) => {
    if (!query || query.length < 2) return;
    try {
      setPatientOptions(await patientService.search(query));
    } catch {
      // silent — search is best-effort as the user types
    }
  };

  const openCreate = () => {
    setSelectedPatient(null);
    setItems([{ ...emptyItem }]);
    setTaxAmount('0');
    setDiscountAmount('0');
    setDueDate('');
    setCreateOpen(true);
  };

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, { ...emptyItem }]);
  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const subtotal = items.reduce((sum, it) => sum + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0), 0);
  const total = Math.max(subtotal + (Number(taxAmount) || 0) - (Number(discountAmount) || 0), 0);

  const handleCreateBill = async () => {
    if (!selectedPatient) {
      enqueueSnackbar('Select a patient first', { variant: 'warning' });
      return;
    }
    if (items.some((it) => !it.description || !it.unitPrice)) {
      enqueueSnackbar('Every line item needs a description and price', { variant: 'warning' });
      return;
    }
    setSaving(true);
    try {
      await billingService.create({
        patientId: selectedPatient.id,
        items: items.map((it) => ({ ...it, quantity: Number(it.quantity) || 1, unitPrice: Number(it.unitPrice) })),
        taxAmount: Number(taxAmount) || 0,
        discountAmount: Number(discountAmount) || 0,
        dueDate: dueDate || undefined,
      });
      enqueueSnackbar('Bill created', { variant: 'success' });
      setCreateOpen(false);
      loadData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not create the bill', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const openPayment = (bill) => {
    setPaymentTarget(bill);
    setPaymentAmount(String(bill.balanceDue));
    setPaymentMethod('CASH');
  };

  const handleRecordPayment = async () => {
    setPayingLoading(true);
    try {
      await billingService.recordPayment({
        billId: paymentTarget.id,
        amount: Number(paymentAmount),
        paymentMethod,
      });
      enqueueSnackbar('Payment recorded', { variant: 'success' });
      setPaymentTarget(null);
      loadData();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Could not record payment', { variant: 'error' });
    } finally {
      setPayingLoading(false);
    }
  };

  const columns = [
    { field: 'billNumber', headerName: 'Bill #', flex: 1, minWidth: 180, renderCell: (p) => <Typography variant="body2" sx={{ fontFamily: '"IBM Plex Mono", monospace' }}>{p.value}</Typography> },
    { field: 'patientName', headerName: 'Patient', flex: 1, minWidth: 160 },
    { field: 'totalAmount', headerName: 'Total', width: 100, renderCell: (p) => <Typography variant="body2" sx={{ fontFamily: '"IBM Plex Mono", monospace' }}>${Number(p.value).toFixed(2)}</Typography> },
    { field: 'balanceDue', headerName: 'Balance', width: 100, renderCell: (p) => <Typography variant="body2" sx={{ fontFamily: '"IBM Plex Mono", monospace' }}>${Number(p.value).toFixed(2)}</Typography> },
    { field: 'status', headerName: 'Status', width: 130, renderCell: (p) => <Chip label={p.value.replace('_', ' ')} size="small" color={STATUS_COLOR[p.value]} /> },
    {
      field: 'actions', headerName: '', width: 110, sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View"><IconButton size="small" onClick={() => setDetailBill(params.row)}><VisibilityOutlinedIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Record payment">
            <span>
              <IconButton size="small" onClick={() => openPayment(params.row)} disabled={params.row.status === 'PAID' || params.row.status === 'CANCELLED'}>
                <PaymentsOutlinedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title="Billing" subtitle={subtitle} actionLabel="New Bill" actionIcon={<AddOutlinedIcon />} onAction={openCreate} />

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

      {/* Create bill */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Bill</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <Autocomplete
              options={patientOptions}
              getOptionLabel={(o) => `${o.firstName} ${o.lastName} — ${o.email}`}
              value={selectedPatient}
              onChange={(_, val) => setSelectedPatient(val)}
              onInputChange={(_, val) => searchPatients(val)}
              renderInput={(params) => <TextField {...params} label="Search patient by name or email" />}
              isOptionEqualToValue={(o, v) => o.id === v.id}
            />

            <Typography variant="subtitle2">Line items</Typography>
            {items.map((item, i) => (
              <Grid container spacing={1.5} key={i} alignItems="center">
                <Grid item xs={3}>
                  <TextField select size="small" label="Type" fullWidth value={item.itemType} onChange={(e) => updateItem(i, 'itemType', e.target.value)}>
                    {ITEM_TYPES.map((t) => <MenuItem key={t} value={t}>{t.replace('_', ' ')}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={4}>
                  <TextField size="small" label="Description" fullWidth value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} />
                </Grid>
                <Grid item xs={2}>
                  <TextField size="small" label="Qty" type="number" fullWidth value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} />
                </Grid>
                <Grid item xs={2}>
                  <TextField size="small" label="Price" type="number" fullWidth value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', e.target.value)} />
                </Grid>
                <Grid item xs={1}>
                  <IconButton size="small" onClick={() => removeItem(i)} disabled={items.length === 1}><DeleteOutlineIcon fontSize="small" /></IconButton>
                </Grid>
              </Grid>
            ))}
            <Button size="small" onClick={addItem} startIcon={<AddOutlinedIcon />} sx={{ alignSelf: 'flex-start' }}>Add line item</Button>

            <Divider />

            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField label="Tax ($)" type="number" fullWidth size="small" value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} />
              </Grid>
              <Grid item xs={4}>
                <TextField label="Discount ($)" type="number" fullWidth size="small" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} />
              </Grid>
              <Grid item xs={4}>
                <TextField label="Due date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </Grid>
            </Grid>

            <Stack direction="row" justifyContent="space-between">
              <Typography variant="subtitle1" fontWeight={600}>Total</Typography>
              <Typography variant="subtitle1" fontWeight={700} sx={{ fontFamily: '"IBM Plex Mono", monospace' }}>${total.toFixed(2)}</Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateBill} disabled={saving}>{saving ? 'Creating…' : 'Create Bill'}</Button>
        </DialogActions>
      </Dialog>

      {/* Bill detail */}
      <Dialog open={Boolean(detailBill)} onClose={() => setDetailBill(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Bill {detailBill?.billNumber}</DialogTitle>
        <DialogContent>
          {detailBill && (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">{detailBill.patientName}</Typography>
              <Divider />
              {detailBill.items?.map((it) => (
                <Stack direction="row" justifyContent="space-between" key={it.id}>
                  <Typography variant="body2">{it.description} × {it.quantity}</Typography>
                  <Typography variant="body2" sx={{ fontFamily: '"IBM Plex Mono", monospace' }}>${Number(it.lineTotal).toFixed(2)}</Typography>
                </Stack>
              ))}
              <Divider />
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Subtotal</Typography><Typography variant="body2">${Number(detailBill.subtotal).toFixed(2)}</Typography></Stack>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Tax</Typography><Typography variant="body2">${Number(detailBill.taxAmount).toFixed(2)}</Typography></Stack>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Discount</Typography><Typography variant="body2">-${Number(detailBill.discountAmount).toFixed(2)}</Typography></Stack>
              <Stack direction="row" justifyContent="space-between"><Typography fontWeight={700}>Total</Typography><Typography fontWeight={700}>${Number(detailBill.totalAmount).toFixed(2)}</Typography></Stack>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="secondary.dark">Paid</Typography><Typography variant="body2" color="secondary.dark">${Number(detailBill.amountPaid).toFixed(2)}</Typography></Stack>
              <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="error.main">Balance due</Typography><Typography variant="body2" color="error.main">${Number(detailBill.balanceDue).toFixed(2)}</Typography></Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDetailBill(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Record payment */}
      <Dialog open={Boolean(paymentTarget)} onClose={() => setPaymentTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Record Payment — {paymentTarget?.billNumber}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField label="Amount ($)" type="number" fullWidth value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
            <TextField select label="Payment method" fullWidth value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) => <MenuItem key={m} value={m}>{m.replace('_', ' ')}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setPaymentTarget(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleRecordPayment} disabled={payingLoading}>{payingLoading ? 'Recording…' : 'Record Payment'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
