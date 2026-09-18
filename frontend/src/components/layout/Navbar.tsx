import React, { useState } from 'react';
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
  InputAdornment,
  Divider,
} from '@mui/material';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import ReplayIcon from '@mui/icons-material/Replay';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import LockOpenIcon from '@mui/icons-material/LockOpen';

import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAppTheme } from '../../context/ThemeContext';

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
  const { user, isAuthenticated, isAdmin, login, register, logout, toggleRole } = useAuth();
  const { wishlist, compareList } = useWishlist();
  const { mode, toggleTheme } = useAppTheme();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegisterMode) {
        await register({
          email: authEmail,
          password: authPassword,
          first_name: authName || 'Rahul',
          last_name: 'Sharma',
        });
      } else {
        const fd = new FormData();
        fd.append('username', authEmail);
        fd.append('password', authPassword);
        await login(fd);
      }
      setAuthModalOpen(false);
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
    } catch {
      alert('Authentication failed. Please check credentials.');
    }
  };

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          bgcolor: mode === 'dark' ? 'rgba(7, 11, 20, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: 'none',
          color: 'text.primary',
          zIndex: 1100,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 68, md: 76 }, px: { xs: 2, md: 3 } }}>
          {/* Logo */}
          <Box
            onClick={() => onTabChange(0)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #00e5ff 0%, #0072ff 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(0, 229, 255, 0.5)',
              }}
            >
              <FlashOnIcon sx={{ color: '#000', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.5, lineHeight: 1.1 }}>
                Car<span style={{ color: '#00e5ff' }}>IQ</span>
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Automotive AI
              </Typography>
            </Box>
          </Box>

          {/* Navigation Tabs */}
          <Tabs
            value={currentTab}
            onChange={(_, val) => onTabChange(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
                bgcolor: '#00e5ff',
                boxShadow: '0 0 10px #00e5ff',
              },
              '& .MuiTab-root': {
                minWidth: { xs: 70, sm: 100 },
                fontWeight: 600,
                fontSize: '0.9rem',
                textTransform: 'none',
                color: 'text.secondary',
                '&.Mui-selected': { color: '#00e5ff' },
              },
            }}
          >
            <Tab label="Home" />
            <Tab label="Discover Cars" />
            <Tab label="AI Advisor" />
            <Tab
              label={
                <Badge badgeContent={compareList.length} color="secondary" sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem' } }}>
                  Compare
                </Badge>
              }
            />
            <Tab label="EMI & Finance" />
            <Tab
              label={
                <Badge badgeContent={wishlist.length} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem' } }}>
                  Wishlist
                </Badge>
              }
            />
            <Tab label="My Bookings" />
            {isAdmin && <Tab icon={<AdminPanelSettingsIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Admin" />}
          </Tabs>

          {/* Right Action Icons & Auth */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Replay Welcome Intro */}
            <Tooltip title="Replay 3D Welcome Intro">
              <IconButton onClick={onReplayIntro} size="small" sx={{ color: 'text.secondary' }}>
                <ReplayIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Service Centers Finder */}
            <Tooltip title="Find Authorized Service Centers">
              <IconButton onClick={onOpenLocations} size="small" sx={{ color: 'text.secondary' }}>
                <LocationOnIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Theme Toggle */}
            <Tooltip title={`Switch to ${mode === 'dark' ? 'Light' : 'Dark'} Mode`}>
              <IconButton onClick={toggleTheme} size="small" sx={{ color: 'text.secondary' }}>
                {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
              </IconButton>
            </Tooltip>

            {/* User Account Button */}
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
                    pr: 1.5,
                    borderRadius: 50,
                    bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: user.role === 'admin' ? '#ff3366' : '#00e5ff',
                      color: user.role === 'admin' ? '#fff' : '#000',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                    }}
                  >
                    {user.first_name?.[0] || 'U'}
                  </Avatar>
                  <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.1 }}>
                      {user.first_name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: user.role === 'admin' ? '#ff3366' : '#00e5ff', fontWeight: 600 }}>
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
                        minWidth: 180,
                        bgcolor: mode === 'dark' ? '#0f172a' : '#ffffff',
                        border: '1px solid rgba(255,255,255,0.1)',
                      },
                    },
                  }}
                >
                  <MenuItem onClick={() => { toggleRole(); setUserMenuAnchor(null); }}>
                    Switch to {user.role === 'admin' ? 'Customer' : 'Admin'} Mode
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={() => { logout(); setUserMenuAnchor(null); }}>
                    Sign Out
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                variant="contained"
                size="small"
                startIcon={<PersonIcon />}
                onClick={() => setAuthModalOpen(true)}
                sx={{ ml: 1, fontWeight: 700 }}
              >
                Sign In
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Auth Dialog (Login / Register) */}
      <Dialog
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '20px',
              bgcolor: mode === 'dark' ? '#0f172a' : '#ffffff',
              border: '1px solid rgba(0, 229, 255, 0.2)',
              p: 1,
            },
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {isRegisterMode ? 'Create CarIQ Account' : 'Welcome to CarIQ'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {isRegisterMode ? 'Access personalized recommendations & purchases' : 'Sign in to access saved cars, financing & orders'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleAuthSubmit} sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {isRegisterMode && (
              <TextField
                label="Full Name"
                variant="outlined"
                fullWidth
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                required
              />
            )}
            <TextField
              label="Email Address"
              type="email"
              variant="outlined"
              fullWidth
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="e.g. demo@cariq.in (or admin@cariq.in for admin)"
              required
            />
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              sx={{ mt: 1, py: 1.4, fontWeight: 700 }}
            >
              {isRegisterMode ? 'Register Now' : 'Sign In'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Button
                variant="text"
                size="small"
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                sx={{ color: '#00e5ff' }}
              >
                {isRegisterMode ? 'Already have an account? Sign In' : "Don't have an account? Register"}
              </Button>
            </Box>

            <Box sx={{ p: 1.5, bgcolor: 'rgba(0, 229, 255, 0.08)', borderRadius: '10px', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                💡 Tip: Use <b>admin@cariq.in</b> to test Admin Dashboard privileges!
              </Typography>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};
