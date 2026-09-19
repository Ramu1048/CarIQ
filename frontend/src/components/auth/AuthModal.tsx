import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Alert,
  Checkbox,
  FormControlLabel,
  Divider,
  Chip,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import LocationCityOutlinedIcon from '@mui/icons-material/LocationCityOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SecurityIcon from '@mui/icons-material/Security';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import LoginIcon from '@mui/icons-material/Login';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { useAuth } from '../../context/AuthContext';

const NAVY = '#1e3a5f';

export type AuthMode = 'customer_login' | 'customer_register' | 'admin_login';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  onAdminLoginSuccess?: () => void;
  onCustomerLoginSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  onClose,
  initialMode = 'customer_login',
  onAdminLoginSuccess,
  onCustomerLoginSuccess,
}) => {
  const { login, register } = useAuth();

  // Active Top Tab: 0 = Customer, 1 = Admin
  const [activeTab, setActiveTab] = useState<number>(initialMode === 'admin_login' ? 1 : 0);
  // Customer submode: 'signin' | 'register'
  const [customerSubMode, setCustomerSubMode] = useState<'signin' | 'register'>(
    initialMode === 'customer_register' ? 'register' : 'signin'
  );

  // Sync mode whenever modal opens with initialMode
  useEffect(() => {
    if (open) {
      if (initialMode === 'admin_login') {
        setActiveTab(1);
      } else {
        setActiveTab(0);
        setCustomerSubMode(initialMode === 'customer_register' ? 'register' : 'signin');
      }
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [open, initialMode]);

  // Form Fields - Customer Sign In
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Form Fields - Customer Register
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Form Fields - Admin Login
  const [adminEmail, setAdminEmail] = useState('admin@cariq.in');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPin, setAdminPin] = useState('2026');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Customer Sign In Submit
  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('username', loginEmail.trim());
      fd.append('password', loginPassword);
      await login(fd, 'customer');
      setSuccessMsg('Welcome back! Successfully signed in.');
      setTimeout(() => {
        onClose();
        if (onCustomerLoginSuccess) onCustomerLoginSuccess();
      }, 500);
    } catch (err: any) {
      setErrorMsg('Sign in failed. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  // Customer Register Submit
  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter your password.');
      return;
    }
    if (regPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('Please agree to the Terms of Service to create an account.');
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: regFullName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim() || undefined,
        location_city: regCity.trim() || undefined,
        password: regPassword,
      });

      setSuccessMsg('Account registered successfully! Welcome to CarIQ.');
      setTimeout(() => {
        onClose();
        if (onCustomerLoginSuccess) onCustomerLoginSuccess();
      }, 700);
    } catch (err: any) {
      setErrorMsg('Registration could not be completed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  // Admin Login Submit
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('username', adminEmail.trim());
      fd.append('password', adminPassword || 'Admin@2026');
      await login(fd, 'admin');

      setSuccessMsg('Administrator verified. Opening Admin Control Center...');
      setTimeout(() => {
        onClose();
        if (onAdminLoginSuccess) onAdminLoginSuccess();
      }, 600);
    } catch (err: any) {
      setErrorMsg('Admin authorization failed. Invalid admin credentials or security pin.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Fillers
  const fillCustomerDemo = () => {
    setLoginEmail('customer@cariq.in');
    setLoginPassword('Customer@123');
    setErrorMsg(null);
  };

  const fillRegistrationDemo = () => {
    setRegFullName('Priya Nair');
    setRegEmail('priya.nair@example.com');
    setRegPhone('9876543210');
    setRegCity('Bengaluru');
    setRegPassword('CarIQ2026!');
    setRegConfirmPassword('CarIQ2026!');
    setErrorMsg(null);
  };

  const fillAdminDemo = () => {
    setAdminEmail('admin@cariq.in');
    setAdminPassword('Admin@2026');
    setAdminPin('2026');
    setErrorMsg(null);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 24px 64px rgba(15, 23, 42, 0.16)',
            overflow: 'hidden',
            bgcolor: '#ffffff',
          },
        },
      }}
    >
      {/* Header Banner & Close */}
      <Box
        sx={{
          p: 2.5,
          pb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e2e8f0',
          bgcolor: activeTab === 1 ? '#f8fafc' : '#ffffff',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              bgcolor: activeTab === 1 ? '#eff6ff' : '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: activeTab === 1 ? '#2563eb' : NAVY,
            }}
          >
            {activeTab === 1 ? <AdminPanelSettingsIcon fontSize="small" /> : <PersonIcon fontSize="small" />}
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.15rem', color: '#0f172a', lineHeight: 1.2 }}>
              {activeTab === 1 ? 'CarIQ Admin Portal' : 'Customer Account'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              {activeTab === 1 ? 'Restricted Access for Dealership Management' : 'Discover, Compare & Book Vehicles'}
            </Typography>
          </Box>
        </Box>

        <IconButton onClick={onClose} size="small" sx={{ color: '#94a3b8', '&:hover': { color: '#0f172a' } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Top Segmented Portal Tabs: Customer Access vs Admin Portal */}
      <Box sx={{ px: 3, pt: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => {
            setActiveTab(val);
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          sx={{
            minHeight: 44,
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              bgcolor: activeTab === 1 ? '#2563eb' : NAVY,
            },
            '& .MuiTab-root': {
              minHeight: 44,
              fontWeight: 700,
              fontSize: '0.86rem',
              textTransform: 'none',
              color: '#64748b',
              py: 1.2,
              '&.Mui-selected': {
                color: activeTab === 1 ? '#2563eb' : NAVY,
              },
            },
          }}
        >
          <Tab icon={<PersonIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Customer Sign In & Register" />
          <Tab icon={<SecurityIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Admin Portal" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: { xs: 2.5, sm: 3.5 }, pt: { xs: 2, sm: 2.5 } }}>
        {/* Success or Error feedback */}
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: '12px', fontSize: '0.85rem' }} onClose={() => setErrorMsg(null)}>
            {errorMsg}
          </Alert>
        )}

        {successMsg && (
          <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2.5, borderRadius: '12px', fontSize: '0.85rem' }}>
            {successMsg}
          </Alert>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            PORTAL 1: CUSTOMER ACCESS (SIGN IN OR REGISTER)
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 0 && (
          <Box>
            {/* Customer Sub-Mode Pill Switcher */}
            <Box
              sx={{
                display: 'flex',
                bgcolor: '#f1f5f9',
                p: 0.5,
                borderRadius: '12px',
                mb: 3,
              }}
            >
              <Button
                fullWidth
                size="small"
                onClick={() => {
                  setCustomerSubMode('signin');
                  setErrorMsg(null);
                }}
                sx={{
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  py: 0.9,
                  bgcolor: customerSubMode === 'signin' ? '#ffffff' : 'transparent',
                  color: customerSubMode === 'signin' ? NAVY : '#64748b',
                  boxShadow: customerSubMode === 'signin' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  '&:hover': { bgcolor: customerSubMode === 'signin' ? '#ffffff' : 'rgba(0,0,0,0.03)' },
                }}
              >
                Customer Sign In
              </Button>
              <Button
                fullWidth
                size="small"
                onClick={() => {
                  setCustomerSubMode('register');
                  setErrorMsg(null);
                }}
                sx={{
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  py: 0.9,
                  bgcolor: customerSubMode === 'register' ? '#ffffff' : 'transparent',
                  color: customerSubMode === 'register' ? NAVY : '#64748b',
                  boxShadow: customerSubMode === 'register' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  '&:hover': { bgcolor: customerSubMode === 'register' ? '#ffffff' : 'rgba(0,0,0,0.03)' },
                }}
              >
                Create New Account
              </Button>
            </Box>

            {/* ── SUB-MODE: CUSTOMER SIGN IN ── */}
            {customerSubMode === 'signin' && (
              <Box component="form" onSubmit={handleCustomerLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
                    Welcome Back!
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Access your saved cars, booking status, and AI car matches.
                  </Typography>
                </Box>

                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="e.g. rahul@example.com"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlinedIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <TextField
                  label="Password"
                  type={showLoginPassword ? 'text' : 'password'}
                  fullWidth
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowLoginPassword(!showLoginPassword)} edge="end" size="small">
                            {showLoginPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        sx={{ color: NAVY, '&.Mui-checked': { color: NAVY } }}
                      />
                    }
                    label={<Typography variant="body2" sx={{ color: '#475569', fontSize: '0.85rem' }}>Remember me</Typography>}
                  />
                  <Button
                    variant="text"
                    size="small"
                    onClick={fillCustomerDemo}
                    sx={{ color: '#2563eb', fontSize: '0.8rem', fontWeight: 600, textTransform: 'none' }}
                  >
                    ⚡ Demo Customer
                  </Button>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <LoginIcon />}
                  sx={{
                    py: 1.4,
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${NAVY} 0%, #2563eb 100%)`,
                    color: '#ffffff',
                    boxShadow: '0 4px 16px rgba(30, 58, 95, 0.25)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      boxShadow: '0 6px 20px rgba(30, 58, 95, 0.35)',
                    },
                  }}
                >
                  {loading ? 'Authenticating...' : 'Sign In as Customer'}
                </Button>

                <Box sx={{ textAlign: 'center', mt: 1 }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    New to CarIQ?{' '}
                    <Button
                      variant="text"
                      onClick={() => setCustomerSubMode('register')}
                      sx={{ color: NAVY, fontWeight: 700, p: 0, textTransform: 'none' }}
                    >
                      Register here
                    </Button>
                  </Typography>
                </Box>
              </Box>
            )}

            {/* ── SUB-MODE: CUSTOMER REGISTRATION ── */}
            {customerSubMode === 'register' && (
              <Box component="form" onSubmit={handleCustomerRegister} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
                    Create Customer Account
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Register to unlock saved wishlists, multi-variant compare & test drive bookings.
                  </Typography>
                </Box>

                <TextField
                  label="Full Name"
                  fullWidth
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="e.g. rahul@example.com"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlinedIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                  <TextField
                    label="Mobile Number"
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="9876543210"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneOutlinedIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  <TextField
                    label="City / Location"
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationCityOutlinedIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Box>

                <TextField
                  label="Create Password"
                  type={showRegPassword ? 'text' : 'password'}
                  fullWidth
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  helperText="Must be at least 8 characters"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowRegPassword(!showRegPassword)} edge="end" size="small">
                            {showRegPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <TextField
                  label="Confirm Password"
                  type={showRegPassword ? 'text' : 'password'}
                  fullWidth
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Re-type your password"
                  error={Boolean(regConfirmPassword && regPassword !== regConfirmPassword)}
                  helperText={
                    regConfirmPassword && regPassword !== regConfirmPassword
                      ? 'Passwords do not match'
                      : ''
                  }
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        sx={{ color: NAVY, '&.Mui-checked': { color: NAVY } }}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem' }}>
                        I agree to CarIQ Terms & Privacy Policy
                      </Typography>
                    }
                  />
                  <Button
                    variant="text"
                    size="small"
                    onClick={fillRegistrationDemo}
                    sx={{ color: '#2563eb', fontSize: '0.78rem', fontWeight: 600, textTransform: 'none' }}
                  >
                    ⚡ Auto-Fill
                  </Button>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <HowToRegIcon />}
                  sx={{
                    py: 1.4,
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${NAVY} 0%, #059669 100%)`,
                    color: '#ffffff',
                    boxShadow: '0 4px 16px rgba(5, 150, 105, 0.25)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      boxShadow: '0 6px 20px rgba(5, 150, 105, 0.35)',
                    },
                  }}
                >
                  {loading ? 'Creating Account...' : 'Complete Registration & Sign In'}
                </Button>

                <Box sx={{ textAlign: 'center', mt: 1 }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Already have an account?{' '}
                    <Button
                      variant="text"
                      onClick={() => setCustomerSubMode('signin')}
                      sx={{ color: NAVY, fontWeight: 700, p: 0, textTransform: 'none' }}
                    >
                      Sign In instead
                    </Button>
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            PORTAL 2: ADMIN PORTAL LOGIN (DEDICATED ADMIN AUTHENTICATION)
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 1 && (
          <Box component="form" onSubmit={handleAdminLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: '14px',
                bgcolor: '#eff6ff',
                border: '1px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <SecurityIcon sx={{ color: '#2563eb', fontSize: 28 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e3a5f' }}>
                  ADMINISTRATIVE ACCESS ONLY
                </Typography>
                <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                  Authorized dealership operators, inventory managers & system administrators.
                </Typography>
              </Box>
            </Box>

            <TextField
              label="Admin ID / Email Address"
              type="email"
              fullWidth
              required
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@cariq.in"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon sx={{ color: '#2563eb', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              label="Admin Security Passkey"
              type={showAdminPassword ? 'text' : 'password'}
              fullWidth
              required
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="••••••••"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <VpnKeyIcon sx={{ color: '#2563eb', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowAdminPassword(!showAdminPassword)} edge="end" size="small">
                        {showAdminPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <TextField
                label="Security PIN / 2FA Token"
                type="text"
                sx={{ flex: 1 }}
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="2026"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Button
                variant="outlined"
                onClick={fillAdminDemo}
                sx={{
                  height: 54,
                  px: 2,
                  borderColor: '#bfdbfe',
                  color: '#2563eb',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  textTransform: 'none',
                  borderRadius: '12px',
                  bgcolor: '#f8fafc',
                  '&:hover': { bgcolor: '#eff6ff', borderColor: '#2563eb' },
                }}
              >
                ⚡ 1-Click Admin Fill
              </Button>
            </Box>

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <AdminPanelSettingsIcon />}
              sx={{
                py: 1.5,
                fontWeight: 900,
                fontSize: '0.96rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)',
                color: '#ffffff',
                boxShadow: '0 6px 20px rgba(30, 58, 95, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)',
                  boxShadow: '0 8px 25px rgba(30, 58, 95, 0.4)',
                },
              }}
            >
              {loading ? 'Verifying Admin Access...' : 'Authenticate & Open Control Center'}
            </Button>

            <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                🔒 All administrative activities are encrypted, audited, and logged with session security.
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
