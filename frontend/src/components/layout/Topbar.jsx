import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar, Avatar, Badge, Box, IconButton, Menu, MenuItem, Toolbar, Typography, Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { useSnackbar } from 'notistack';
import useAuth from '../../hooks/useAuth';
import { SIDEBAR_WIDTH } from './Sidebar';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout();
    enqueueSnackbar('You have been logged out', { variant: 'info' });
    navigate('/login');
  };

  const initials = user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}` : '';

  return (
    <AppBar
      position="fixed"
      color="inherit"
      sx={{
        bgcolor: 'background.paper',
        width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
        ml: { md: `${SIDEBAR_WIDTH}px` },
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton sx={{ display: { md: 'none' } }} onClick={onMenuClick} edge="start">
            <MenuIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton onClick={() => navigate(notificationsPathFor(user?.role))}>
            <Badge color="secondary" variant="dot" invisible={false}>
              <NotificationsNoneOutlinedIcon />
            </Badge>
          </IconButton>

          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
            <Avatar
              src={user?.profileImageUrl}
              sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14, fontWeight: 600 }}
            >
              {initials}
            </Avatar>
          </IconButton>

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2">{user?.firstName} {user?.lastName}</Typography>
              <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => { setAnchorEl(null); navigate(profilePathFor(user?.role)); }}>
              <PersonOutlineIcon fontSize="small" sx={{ mr: 1.5 }} /> My Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutOutlinedIcon fontSize="small" sx={{ mr: 1.5 }} /> Log Out
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

function profilePathFor(role) {
  const base = (role || '').toLowerCase();
  return `/${base}/profile`;
}

function notificationsPathFor(role) {
  const base = (role || '').toLowerCase();
  return `/${base}/notifications`;
}
