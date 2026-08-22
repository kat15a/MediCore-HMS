import { Box, Button, Stack, Typography } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';

export default function EmptyState({ title = 'Nothing here yet', description, actionLabel, onAction, icon: Icon = InboxOutlinedIcon }) {
  return (
    <Box sx={{ py: 6 }}>
      <Stack spacing={1.5} alignItems="center" textAlign="center">
        <Icon sx={{ fontSize: 36, color: 'text.secondary' }} />
        <Typography variant="subtitle1" fontWeight={600}>{title}</Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380 }}>
            {description}
          </Typography>
        )}
        {actionLabel && (
          <Button variant="outlined" size="small" onClick={onAction} sx={{ mt: 1 }}>
            {actionLabel}
          </Button>
        )}
      </Stack>
    </Box>
  );
}
