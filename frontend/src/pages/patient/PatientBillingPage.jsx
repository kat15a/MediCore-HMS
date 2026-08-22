import { useEffect, useState } from 'react';
import {
  Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, IconButton, MenuItem, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import useAuth from '../../hooks/useAuth';
import billingService from '../../services/billingService';

const STATUS_COLOR = { PENDING: 'warning', PARTIALLY_PAID: 'info', PAID: 'success', CANCELLED: 'default' };
const PAYMENT_METHODS = ['CASH', 'CARD', 'UPI', 'NET_BANKING', 'INSURANCE'];

export default function PatientBillingPage() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  const [payTarget, setPayTarget] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CARD');
  const [paying, setPaying] = useState(false);

  const loadBills = async () => {
    if (!user?.profileId) return;
    setLoading(true);
    try {
      const page = await billingService.getByPatient(user.profileId, { size: 100, sort: 'createdAt,desc' });
      setRows(page.content);
    } catch {
      enqueueSnackbar('Could not load your bills', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBills(); }, [user?.profileId]); // eslint-disable-line react-hooks/exhaustive-deps

  const openPay = (bill) => {
    setPayTarget(bill);
    setPayAmount(String(bill.balanceDue));
    setPayMethod('CARD');
  };

  const submitPayment = async () => {
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      enqueueSnackbar('Enter a valid amount', { variant: 'warning' });
      return;
    }
    if (amount > payTarget.balanceDue) {
      enqueueSnackbar(`Amount can't exceed the balance due ($${payTarget.balanceDue})`, { variant: 'warning' });
      return;
    }
    setPaying(true);
    try {
      await billingService.recordPayment({ billId: payTarget.id, amount, paymentMethod: payMethod });
      enqueueSnackbar('Payment recorded — thank you!', { variant: 'success' });
      setPayTarget(null);
      loadBills();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Payment could not be processed', { variant: 'error' });
    } finally {
      setPaying(false);
    }
  };

  const columns = [
    { field: 'billNumber', headerName: 'Bill #', width: 200, renderCell: (p) => <Typography variant="body2" sx={{ fontFamily: '"IBM Plex Mono", monospace' }}>{p.value}</Typography> },
    { field: 'createdAt', headerName: 'Date', width: 120, renderCell: (p) => new Date(p.value).toLocaleDateString() },
    { field: 'totalAmount', headerName: 'Total', width: 100, renderCell: (p) => `$${Number(p.value).toFixed(2)}` },
    { field: 'balanceDue', headerName: 'Balance Due', width: 130, renderCell: (p) => `$${Number(p.value).toFixed(2)}` },
    {
      field: 'status', headerName: 'Status', width: 130,
      renderCell: (p) => <Chip label={p.value.replace('_', ' ')} size="small" color={STATUS_COLOR[p.value]} variant={STATUS_COLOR[p.value] === 'default' ? 'outlined' : 'filled'} />,
    },
    {
      field: 'actions', headerName: '', width: 150, sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View"><IconButton size="small" onClick={() => setDetail(params.row)}><VisibilityOutlinedIcon fontSize="small" /></IconButton></Tooltip>
          {params.row.balanceDue > 0 && params.row.status !== 'CANCELLED' && (
            <Button size="small" startIcon={<PaymentsOutlinedIcon />} onClick={() => openPay(params.row)}>Pay</Button>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title="Bills & Payments" subtitle="Review your charges and settle any balance due." />
      <Card sx={{ p: loading ? 3 : 0 }}>
        {loading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : rows.length === 0 ? (
          <EmptyState title="No bills yet" description="Bills from your visits will appear here." />
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            autoHeight
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            sx={{ border: 'none' }}
          />
        )}
      </Card>

      {/* ---- Bill detail ---- */}
      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Bill {detail?.billNumber}</DialogTitle>
        <DialogContent>
          {detail && (
            <Stack spacing={2}>
              <Stack spacing={0.5}>
                {detail.items?.map((it) => (
                  <Stack key={it.id} direction="row" justifyContent="space-between">
                    <Typography variant="body2">{it.description} × {it.quantity}</Typography>
                    <Typography variant="body2" sx={{ fontFamily: '"IBM Plex Mono", monospace' }}>${Number(it.lineTotal).toFixed(2)}</Typography>
                  </Stack>
                ))}
              </Stack>
              <Divider />
              <Stack spacing={0.5}>
                <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Subtotal</Typography><Typography variant="body2">${Number(detail.subtotal).toFixed(2)}</Typography></Stack>
                <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Tax</Typography><Typography variant="body2">${Number(detail.taxAmount).toFixed(2)}</Typography></Stack>
                <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Discount</Typography><Typography variant="body2">-${Number(detail.discountAmount).toFixed(2)}</Typography></Stack>
                <Stack direction="row" justifyContent="space-between"><Typography variant="subtitle2">Total</Typography><Typography variant="subtitle2">${Number(detail.totalAmount).toFixed(2)}</Typography></Stack>
                <Stack direction="row" justifyContent="space-between"><Typography variant="body2" color="secondary.dark">Paid</Typography><Typography variant="body2" color="secondary.dark">${Number(detail.amountPaid).toFixed(2)}</Typography></Stack>
                <Stack direction="row" justifyContent="space-between"><Typography variant="subtitle2" color="error.main">Balance Due</Typography><Typography variant="subtitle2" color="error.main">${Number(detail.balanceDue).toFixed(2)}</Typography></Stack>
              </Stack>
              {detail.payments?.length > 0 && (
                <>
                  <Divider />
                  <Typography variant="subtitle2">Payment History</Typography>
                  {detail.payments.map((p) => (
                    <Stack key={p.id} direction="row" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">
                        {new Date(p.paidAt).toLocaleDateString()} · {p.paymentMethod}
                      </Typography>
                      <Typography variant="caption">${Number(p.amount).toFixed(2)}</Typography>
                    </Stack>
                  ))}
                </>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDetail(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ---- Pay dialog ---- */}
      <Dialog open={Boolean(payTarget)} onClose={() => setPayTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Pay Bill {payTarget?.billNumber}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Balance due: <strong>${Number(payTarget?.balanceDue ?? 0).toFixed(2)}</strong>
            </Typography>
            <TextField
              label="Amount to pay" type="number" fullWidth value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
            />
            <TextField select label="Payment method" fullWidth value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) => <MenuItem key={m} value={m}>{m.replace('_', ' ')}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setPayTarget(null)}>Cancel</Button>
          <Button variant="contained" onClick={submitPayment} disabled={paying}>
            {paying ? 'Processing…' : 'Pay Now'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
