import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Divider,
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ReplayIcon from '@mui/icons-material/Replay';

import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { AuthModal, AuthMode } from '../auth/AuthModal';
import SecurityIcon from '@mui/icons-material/Security';

const NAVY = '#1e3a5f';

interface NavbarProps {
  currentTab: number;
  onTabChange: (newTab: number) => void;
  onReplayIntro: () => void;
  onOpenLocations: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onReplayIntro,
  onOpenLocations,
}) => {
  const { user, isAuthenticated, isAdmin, logout, toggleRole } = useAuth();
  const { wishlist, compareList } = useWishlist();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<AuthMode>('customer_login');
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    const handleOpenAdmin = () => {
      setAuthInitialMode('admin_login');
      setAuthModalOpen(true);
    };
    const handleOpenRegister = () => {
      setAuthInitialMode('customer_register');
      setAuthModalOpen(true);
    };
    const handleOpenLogin = () => {
      setAuthInitialMode('customer_login');
      setAuthModalOpen(true);
    };
    window.addEventListener('cariq_open_admin_auth', handleOpenAdmin);
    window.addEventListener('cariq_open_customer_register', handleOpenRegister);
    window.addEventListener('cariq_open_customer_login', handleOpenLogin);
    return () => {
      window.removeEventListener('cariq_open_admin_auth', handleOpenAdmin);
      window.removeEventListener('cariq_open_customer_register', handleOpenRegister);
      window.removeEventListener('cariq_open_customer_login', handleOpenLogin);
    };
  }, []);

  const openCustomerLogin = () => {
    setAuthInitialMode('customer_login');
    setAuthModalOpen(true);
  };

  const openCustomerRegister = () => {
    setAuthInitialMode('customer_register');
    setAuthModalOpen(true);
  };

  const openAdminLogin = () => {
    setAuthInitialMode('admin_login');
    setAuthModalOpen(true);
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 1px 8px rgba(15, 23, 42, 0.06)',
          color: 'text.primary',
          zIndex: 1100,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 64, md: 72 }, px: { xs: 2, md: 4 } }}>

          {/* ── Logo ─────────────────────────────────────────────────── */}
          <Box
            onClick={() => onTabChange(0)}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', userSelect: 'none' }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${NAVY} 0%, #2d5a9e 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(30, 58, 95, 0.35)',
              }}
            >
              <DirectionsCarIcon sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.3, lineHeight: 1.1, color: '#0f172a' }}>
                Car<span style={{ color: NAVY }}>IQ</span>
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.6rem', letterSpacing: 1.8, textTransform: 'uppercase' }}>
                Automotive AI
              </Typography>
            </Box>
          </Box>

          {/* ── Navigation Tabs ──────────────────────────────────────── */}
          <Tabs
            value={currentTab}
            onChange={(_, val) => onTabChange(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-indicator': {
                height: 2,
                borderRadius: '2px 2px 0 0',
                bgcolor: NAVY,
              },
              '& .MuiTab-root': {
                minWidth: { xs: 70, sm: 90 },
                fontWeight: 500,
                fontSize: '0.88rem',
                textTransform: 'none',
                color: '#64748b',
                py: 2.5,
                '&.Mui-selected': { color: NAVY, fontWeight: 700 },
                '&:hover': { color: NAVY, background: 'rgba(30, 58, 95, 0.04)' },
              },
            }}
          >
            <Tab label="Home" />
            <Tab label="Discover Cars" />
            <Tab label="AI Advisor" />
            <Tab
              label={
                <Badge badgeContent={compareList.length} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }}>
                  Compare
                </Badge>
              }
            />
            <Tab label="EMI & Finance" />
            <Tab
              label={
                <Badge badgeContent={wishlist.length} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }}>
                  Wishlist
                </Badge>
              }
            />
            <Tab label="My Bookings" />
            {isAdmin && <Tab icon={<AdminPanelSettingsIcon sx={{ fontSize: 17 }} />} iconPosition="start" label="Admin" />}
          </Tabs>

          {/* ── Right Actions ─────────────────────────────────────────── */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Replay 3D Welcome Intro">
              <IconButton onClick={onReplayIntro} size="small" sx={{ color: '#64748b', '&:hover': { color: NAVY, bgcolor: 'rgba(30,58,95,0.06)' } }}>
                <ReplayIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Service Centers Near You">
              <IconButton onClick={onOpenLocations} size="small" sx={{ color: '#64748b', '&:hover': { color: NAVY, bgcolor: 'rgba(30,58,95,0.06)' } }}>
                <LocationOnIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Wishlist">
              <IconButton size="small" onClick={() => onTabChange(5)} sx={{ color: '#64748b', '&:hover': { color: '#ef4444', bgcolor: 'rgba(239,68,68,0.06)' } }}>
                <Badge badgeContent={wishlist.length} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }}>
                  <FavoriteIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Compare Cars">
              <IconButton size="small" onClick={() => onTabChange(3)} sx={{ color: '#64748b', '&:hover': { color: NAVY, bgcolor: 'rgba(30,58,95,0.06)' } }}>
                <Badge badgeContent={compareList.length} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }}>
                  <CompareArrowsIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* User Account */}
            {isAuthenticated && user ? (
              <>
                <Box
                  onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    ml: 1,
                    p: 0.6,
                    pr: 1.4,
                    borderRadius: 50,
                    border: '1.5px solid #e2e8f0',
                    cursor: 'pointer',
                    bgcolor: '#f8fafc',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: NAVY, bgcolor: 'rgba(30,58,95,0.04)' },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 30,
                      height: 30,
                      bgcolor: user.role === 'admin' ? '#ef4444' : NAVY,
                      color: '#fff',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    {user.first_name?.[0] || 'U'}
                  </Avatar>
                  <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.1, fontSize: '0.82rem', color: '#0f172a' }}>
                      {user.first_name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: user.role === 'admin' ? '#ef4444' : NAVY, fontWeight: 600, fontSize: '0.6rem', letterSpacing: 0.8 }}>
                      {user.role.toUpperCase()}
                    </Typography>
                  </Box>
                </Box>

                <Menu
                  anchorEl={userMenuAnchor}
                  open={Boolean(userMenuAnchor)}
                  onClose={() => setUserMenuAnchor(null)}
                  slotProps={{
                    paper: {
                      sx: {
                        mt: 1.5,
                        minWidth: 190,
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
                      },
                    },
                  }}
                >
                  {user.role === 'admin' ? (
                    <>
                      <MenuItem
                        onClick={() => {
                          onTabChange(7);
                          setUserMenuAnchor(null);
                        }}
                        sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#2563eb' }}
                      >
                        <AdminPanelSettingsIcon sx={{ fontSize: 18, mr: 1, color: '#2563eb' }} />
                        Admin Control Center
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          toggleRole();
                          setUserMenuAnchor(null);
                        }}
                        sx={{ fontSize: '0.85rem', color: '#64748b' }}
                      >
                        Switch to Customer View
                      </MenuItem>
                    </>
                  ) : (
                    <>
                      <MenuItem
                        onClick={() => {
                          onTabChange(6);
                          setUserMenuAnchor(null);
                        }}
                        sx={{ fontSize: '0.88rem', fontWeight: 600, color: NAVY }}
                      >
                        My Bookings & Receipts
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          onTabChange(5);
                          setUserMenuAnchor(null);
                        }}
                        sx={{ fontSize: '0.85rem', color: '#64748b' }}
                      >
                        My Wishlist
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          openAdminLogin();
                          setUserMenuAnchor(null);
                        }}
                        sx={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 600 }}
                      >
                        <SecurityIcon sx={{ fontSize: 16, mr: 1 }} />
                        Switch to Admin Portal
                      </MenuItem>
                    </>
                  )}
                  <Divider />
                  <MenuItem
                    onClick={() => {
                      logout();
                      setUserMenuAnchor(null);
                    }}
                    sx={{ fontSize: '0.88rem', color: '#ef4444', fontWeight: 600 }}
                  >
                    Sign Out
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SecurityIcon sx={{ fontSize: 16 }} />}
                  onClick={openAdminLogin}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    color: '#2563eb',
                    borderColor: '#bfdbfe',
                    bgcolor: '#eff6ff',
                    borderRadius: '8px',
                    px: 1.5,
                    display: { xs: 'none', sm: 'inline-flex' },
                    '&:hover': { bgcolor: '#dbeafe', borderColor: '#2563eb' },
                  }}
                >
                  Admin Portal
                </Button>

                <Button
                  variant="text"
                  size="small"
                  onClick={openCustomerRegister}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    color: NAVY,
                    borderRadius: '8px',
                    px: 1.2,
                    display: { xs: 'none', md: 'inline-flex' },
                    '&:hover': { bgcolor: 'rgba(30,58,95,0.05)' },
                  }}
                >
                  Register
                </Button>

                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PersonIcon sx={{ fontSize: 18 }} />}
                  onClick={openCustomerLogin}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    borderRadius: '8px',
                    bgcolor: NAVY,
                    px: 1.8,
                    '&:hover': { bgcolor: '#152943' },
                  }}
                >
                  Sign In
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Unified Auth Modal with Customer Sign In, Register, & Admin Portal */}
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authInitialMode}
        onAdminLoginSuccess={() => onTabChange(7)}
      />
    </>
  );
};
