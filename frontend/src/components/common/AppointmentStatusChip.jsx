import { Chip } from '@mui/material';

const STATUS_STYLES = {
  PENDING: { color: 'warning', label: 'Pending' },
  CONFIRMED: { color: 'info', label: 'Confirmed' },
  IN_PROGRESS: { color: 'secondary', label: 'In Progress' },
  COMPLETED: { color: 'success', label: 'Completed' },
  CANCELLED: { color: 'default', label: 'Cancelled' },
  NO_SHOW: { color: 'error', label: 'No Show' },
};

export default function AppointmentStatusChip({ status, size = 'small' }) {
  const style = STATUS_STYLES[status] || { color: 'default', label: status };
  return <Chip label={style.label} color={style.color === 'default' ? undefined : style.color} variant={style.color === 'default' ? 'outlined' : 'filled'} size={size} />;
}
