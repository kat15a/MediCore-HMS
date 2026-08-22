import { NavLink, useLocation } from 'react-router-dom';
import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from '@mui/material';
import { navConfig } from '../../routes/navConfig';
import PulseLine from '../common/PulseLine';

export const SIDEBAR_WIDTH = 264;

export default function Sidebar({ role, mobileOpen, onClose }) {
  const location = useLocation();
  const items = navConfig[role] || [];

  const content = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'primary.dark', color: '#fff' }}>
      <Toolbar sx={{ px: 3, py: 2.5 }}>
        <Box>
          <Typography variant="h6" sx={{ fontFamily: '"Fraunces", serif', fontWeight: 600, lineHeight: 1 }}>
            MediCore
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.7, fontFamily: '"IBM Plex Mono", monospace' }}>
            {role?.charAt(0) + role?.slice(1).toLowerCase()} portal
          </Typography>
        </Box>
      </Toolbar>
      <Box sx={{ px: 2, opacity: 0.5 }}>
        <PulseLine height={20} animated={false} />
      </Box>
      <List sx={{ flex: 1, px: 1.5, py: 2 }}>
        {items.map(({ label, path, icon: Icon }) => {
          const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
          return (
            <ListItemButton
              key={path}
              component={NavLink}
              to={path}
              onClick={onClose}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                color: isActive ? '#fff' : 'rgba(255,255,255,0.72)',
                bgcolor: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={label}
                primaryTypographyProps={{ fontSize: 14, fontWeight: isActive ? 600 : 500 }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  return (
    <>
      {/* Desktop: permanent sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, boxSizing: 'border-box', border: 'none' },
        }}
        open
      >
        {content}
      </Drawer>

      {/* Mobile: temporary drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, boxSizing: 'border-box', border: 'none' },
        }}
      >
        {content}
      </Drawer>
    </>
  );
}
