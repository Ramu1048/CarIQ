import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import SpeedIcon from '@mui/icons-material/Speed';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VerifiedIcon from '@mui/icons-material/Verified';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import CalculateIcon from '@mui/icons-material/Calculate';
import SecurityIcon from '@mui/icons-material/Security';

import { CylinderCarCarousel } from './CylinderCarCarousel';
import { Car3DViewer } from '../3d/Car3DViewer';
import { Vehicle } from '../../types';
import { useWishlist } from '../../context/WishlistContext';

const NAVY   = '#1e3a5f';
const AMBER  = '#f59e0b';

interface HomeTabProps {
  vehicles: Vehicle[];
  onNavigateToCatalog: (searchQuery?: string) => void;
  onNavigateToAI: (initialQuery?: string) => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onStartPurchase: (vehicle: Vehicle) => void;
}

const QUICK_SEARCH_PILLS = [
  'Safe automatic SUV under 20 lakh',
  'Electric cars with 400km+ range',
  '7-seater family car with sunroof',
  'Low maintenance city car',
  'High ground clearance under 15 lakh',
];

const VALUE_PROPS = [
  {
    icon: <AutoAwesomeIcon />,
    color: NAVY,
    bg: '#eff6ff',
    border: '#dbeafe',
    title: 'AI Multi-Factor Matching',
    desc: 'Our neural engine extracts your driving habits, luggage needs, and budget to calculate an objective match score.',
  },
  {
    icon: <VerifiedIcon />,
    color: '#10b981',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    title: 'Verified Real-World Specs',
    desc: 'Bharat NCAP crash ratings, ARAI fuel economy, ground clearance, and service costs — without dealership bias.',
  },
  {
    icon: <CalculateIcon />,
    color: AMBER,
    bg: '#fffbeb',
    border: '#fde68a',
    title: 'Digital Booking & Finance',
    desc: 'Interactive EMI calculator, instant KYC upload, secure token deposit, and real-time delivery tracking.',
  },
];

export const HomeTab: React.FC<HomeTabProps> = ({
  vehicles,
  onNavigateToCatalog,
  onNavigateToAI,
  onSelectVehicle,
  onStartPurchase,
}) => {
  const { addToWishlist, removeFromWishlist, isInWishlist, toggleCompare, isInCompare } = useWishlist();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    onNavigateToAI(searchQuery);
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <Box sx={{ pb: 10, bgcolor: '#f8fafc' }}>

      {/* ── Hero Section ───────────────────────────────────────────── */}
      <Box
        sx={{
          pt: { xs: 6, md: 8 },
          pb: { xs: 6, md: 8 },
          background: 'linear-gradient(160deg, #f0f6ff 0%, #ffffff 50%, #fff8f0 100%)',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ textAlign: 'center', maxWidth: 820, mx: 'auto' }}>

            {/* Badge chip */}
            <Chip
              icon={<AutoAwesomeIcon sx={{ color: `${NAVY} !important`, fontSize: 15 }} />}
              label="AI-POWERED AUTOMOTIVE DISCOVERY"
              sx={{
                bgcolor: '#eff6ff',
                color: NAVY,
                fontWeight: 700,
                fontSize: '0.7rem',
                border: `1px solid #bfdbfe`,
                letterSpacing: 0.8,
                mb: 3,
                px: 0.5,
              }}
            />

            {/* Headline */}
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.2rem', sm: '3rem', md: '3.8rem' },
                fontWeight: 900,
                lineHeight: 1.15,
                color: '#0f172a',
                mb: 2.5,
              }}
            >
              Intelligent Car Buying,{' '}
              <Box component="span" sx={{ color: NAVY }}>
                Engineered for You.
              </Box>
            </Typography>

            <Typography
              variant="h6"
              sx={{ color: '#64748b', fontWeight: 400, fontSize: { xs: '1rem', md: '1.15rem' }, lineHeight: 1.7, mb: 4 }}
            >
              Ask in plain language, explore the 3D fleet, simulate aerodynamics, and lock down financing
              with transparent on-road pricing.
            </Typography>

            {/* Search bar */}
            <Box
              component="form"
              onSubmit={handleSearchSubmit}
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: '6px 6px 6px 0',
                bgcolor: '#ffffff',
                borderRadius: '50px',
                border: '1.5px solid #e2e8f0',
                boxShadow: '0 4px 24px rgba(30, 58, 95, 0.1)',
                maxWidth: 660,
                mx: 'auto',
                '&:focus-within': {
                  borderColor: NAVY,
                  boxShadow: '0 4px 24px rgba(30, 58, 95, 0.18)',
                },
                transition: 'all 0.25s ease',
              }}
            >
              <TextField
                fullWidth
                variant="standard"
                placeholder="Ask CarIQ — e.g. 'Safe automatic SUV under ₹20 lakh'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                slotProps={{
                  input: {
                    disableUnderline: true,
                    startAdornment: (
                      <InputAdornment position="start" sx={{ pl: 2.5 }}>
                        <SearchIcon sx={{ color: '#94a3b8', fontSize: 22 }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{ input: { fontSize: '0.97rem', py: 1.2, color: '#0f172a' } }}
              />
              <Button
                type="submit"
                variant="contained"
                sx={{
                  borderRadius: '50px',
                  px: { xs: 2.5, sm: 4 },
                  py: 1.3,
                  whiteSpace: 'nowrap',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  flexShrink: 0,
                }}
              >
                Ask AI
              </Button>
            </Box>

            {/* Quick Pills */}
            <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', alignSelf: 'center', mr: 0.5, fontWeight: 500 }}>
                Try:
              </Typography>
              {QUICK_SEARCH_PILLS.map((pill) => (
                <Chip
                  key={pill}
                  label={pill}
                  onClick={() => onNavigateToAI(pill)}
                  size="small"
                  sx={{
                    cursor: 'pointer',
                    bgcolor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    color: '#475569',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: '#eff6ff',
                      borderColor: '#bfdbfe',
                      color: NAVY,
                    },
                  }}
                />
              ))}
            </Box>

            {/* Scroll CTA */}
            <Box sx={{ mt: 5, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={() => scrollToSection('cylinder-showroom')}
                endIcon={
                  <KeyboardDoubleArrowDownIcon
                    sx={{
                      animation: 'bounceDown 1.6s infinite ease-in-out',
                      '@keyframes bounceDown': {
                        '0%, 100%': { transform: 'translateY(0)' },
                        '50%': { transform: 'translateY(5px)' },
                      },
                    }}
                  />
                }
                sx={{
                  borderColor: '#cbd5e1',
                  color: '#475569',
                  borderRadius: '30px',
                  px: 3.5,
                  py: 1.1,
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  '&:hover': {
                    borderColor: NAVY,
                    color: NAVY,
                    bgcolor: 'rgba(30, 58, 95, 0.04)',
                  },
                }}
              >
                Explore 3D Showroom
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ pt: 6 }}>

        {/* ── 3D Carousel ───────────────────────────────────────────── */}
        <Box id="cylinder-showroom" sx={{ mb: 10, scrollMarginTop: '80px' }}>
          <CylinderCarCarousel
            vehicles={vehicles}
            onSelectVehicle={onSelectVehicle}
            onStartPurchase={onStartPurchase}
          />
        </Box>

        {/* ── 3D Aerodynamics Studio ────────────────────────────────── */}
        <Box id="aerodynamics-studio" sx={{ mb: 10, scrollMarginTop: '80px' }}>
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', gap: 2, justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Box>
              <Chip
                icon={<ViewInArIcon sx={{ fontSize: 15, color: `${NAVY} !important` }} />}
                label="INTERACTIVE STUDIO"
                size="small"
                sx={{ bgcolor: '#eff6ff', color: NAVY, fontWeight: 700, border: '1px solid #bfdbfe', mb: 1 }}
              />
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Aerodynamics & Color Customizer
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                Simulate wind tunnel airflow, inspect chassis geometry, and toggle exterior colours in real time.
              </Typography>
            </Box>
          </Box>
          <Car3DViewer />
        </Box>

        {/* ── Value Propositions ────────────────────────────────────── */}
        <Grid container spacing={3} sx={{ mb: 10 }}>
          {VALUE_PROPS.map((vp) => (
            <Grid size={{ xs: 12, md: 4 }} key={vp.title}>
              <Card sx={{ p: 3.5, height: '100%', border: `1px solid ${vp.border}` }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    bgcolor: vp.bg,
                    color: vp.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  {vp.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
                  {vp.title}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.7 }}>
                  {vp.desc}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* ── Featured Vehicles ─────────────────────────────────────── */}
        <Box sx={{ mb: 8 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
            <Box>
              <Typography variant="overline" sx={{ color: NAVY, fontWeight: 700, letterSpacing: 2, display: 'block' }}>
                TOP RATED IN INDIA
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                Featured Vehicles
              </Typography>
            </Box>
            <Button
              variant="text"
              endIcon={<ArrowForwardIcon />}
              onClick={() => onNavigateToCatalog()}
              sx={{ color: NAVY, fontWeight: 700 }}
            >
              View All Cars
            </Button>
          </Box>

          <Grid container spacing={3}>
            {vehicles.slice(0, 3).map((vehicle) => {
              const inWishlist = isInWishlist(vehicle.id);
              const inCompare  = isInCompare(vehicle.id);

              return (
                <Grid size={{ xs: 12, md: 4 }} key={vehicle.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

                    {/* Floating action icons */}
                    <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 5, display: 'flex', gap: 0.6 }}>
                      <Tooltip title={inCompare ? 'Remove from Compare' : 'Add to Compare'}>
                        <IconButton
                          size="small"
                          onClick={() => toggleCompare(vehicle)}
                          sx={{
                            bgcolor: inCompare ? NAVY : 'rgba(255,255,255,0.92)',
                            color: inCompare ? '#fff' : '#475569',
                            boxShadow: '0 2px 8px rgba(15,23,42,0.12)',
                            '&:hover': { bgcolor: NAVY, color: '#fff' },
                          }}
                        >
                          <CompareArrowsIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={inWishlist ? 'Remove from Wishlist' : 'Save to Wishlist'}>
                        <IconButton
                          size="small"
                          onClick={() => (inWishlist ? removeFromWishlist(vehicle.id) : addToWishlist(vehicle))}
                          sx={{
                            bgcolor: inWishlist ? '#fef2f2' : 'rgba(255,255,255,0.92)',
                            color: inWishlist ? '#ef4444' : '#475569',
                            boxShadow: '0 2px 8px rgba(15,23,42,0.12)',
                            '&:hover': { bgcolor: '#fef2f2', color: '#ef4444' },
                          }}
                        >
                          {inWishlist ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Box>

                    {/* Fuel type badge */}
                    <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 5 }}>
                      <Chip
                        label={vehicle.fuel_type.toUpperCase()}
                        size="small"
                        sx={{
                          bgcolor: vehicle.fuel_type.toLowerCase() === 'electric' ? '#f0fdf4' : '#fffff',
                          color: vehicle.fuel_type.toLowerCase() === 'electric' ? '#10b981' : '#475569',
                          border: '1px solid',
                          borderColor: vehicle.fuel_type.toLowerCase() === 'electric' ? '#bbf7d0' : '#e2e8f0',
                          fontWeight: 700,
                          fontSize: '0.65rem',
                          boxShadow: '0 1px 4px rgba(15,23,42,0.08)',
                        }}
                      />
                    </Box>

                    {/* Vehicle image */}
                    <CardMedia
                      component="img"
                      height="200"
                      image={vehicle.primary_image_url || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'}
                      alt={vehicle.model_name}
                      sx={{ objectFit: 'cover', cursor: 'pointer', bgcolor: '#f8fafc' }}
                      onClick={() => onSelectVehicle(vehicle)}
                    />

                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      {/* Brand + Safety */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                          {vehicle.brand?.name}
                        </Typography>
                        <Chip
                          icon={<SecurityIcon sx={{ fontSize: 12, color: '#10b981 !important' }} />}
                          label={`${vehicle.safety_rating || 5}★`}
                          size="small"
                          sx={{ bgcolor: '#f0fdf4', color: '#10b981', fontWeight: 700, fontSize: '0.68rem', border: '1px solid #bbf7d0' }}
                        />
                      </Box>

                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 800, cursor: 'pointer', color: '#0f172a', mb: 1.5, '&:hover': { color: NAVY } }}
                        onClick={() => onSelectVehicle(vehicle)}
                      >
                        {vehicle.model_name}
                      </Typography>

                      {/* Specs chips */}
                      <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
                        <Chip icon={<LocalGasStationIcon sx={{ fontSize: 13 }} />} label={vehicle.fuel_type.toUpperCase()} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                        <Chip icon={<SpeedIcon sx={{ fontSize: 13 }} />} label={vehicle.transmission.toUpperCase()} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                        <Chip label={vehicle.ev_range_km ? `${vehicle.ev_range_km} km` : `${vehicle.mileage_kmpl || 18.5} km/l`} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                      </Box>

                      {/* Price + CTA */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: '1px solid #f1f5f9' }}>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', lineHeight: 1, fontWeight: 600 }}>EX-SHOWROOM</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: NAVY }}>
                            ₹{(vehicle.ex_showroom_price / 100000).toFixed(2)} L
                          </Typography>
                        </Box>
                        <Button variant="contained" size="small" onClick={() => onStartPurchase(vehicle)} sx={{ fontWeight: 700, px: 2.5 }}>
                          Book Now
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};
