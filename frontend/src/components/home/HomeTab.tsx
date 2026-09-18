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
import SecurityIcon from '@mui/icons-material/Security';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VerifiedIcon from '@mui/icons-material/Verified';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import ViewInArIcon from '@mui/icons-material/ViewInAr';

import { CylinderCarCarousel } from './CylinderCarCarousel';
import { Car3DViewer } from '../3d/Car3DViewer';
import { Vehicle, VehicleSummary } from '../../types';
import { useWishlist } from '../../context/WishlistContext';

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
  '7-seater family car with panoramic sunroof',
  'Low maintenance daily city car',
  'High ground clearance under 15 lakh',
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

  const handlePillClick = (pill: string) => {
    onNavigateToAI(pill);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Box sx={{ pb: 10 }}>
      {/* Hero Showcase Section */}
      <Box
        sx={{
          pt: { xs: 4, md: 6 },
          pb: { xs: 4, md: 6 },
          background: 'radial-gradient(ellipse at top, rgba(0, 229, 255, 0.08) 0%, transparent 70%)',
        }}
      >
        <Container maxWidth="xl">
          {/* Header Title & Subtitle */}
          <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 4 }, maxWidth: 880, mx: 'auto' }}>
            <Chip
              icon={<AutoAwesomeIcon sx={{ color: '#00e5ff !important' }} />}
              label="AI-POWERED AUTOMOTIVE DISCOVERY PLATFORM"
              sx={{
                bgcolor: 'rgba(0, 229, 255, 0.1)',
                color: '#00e5ff',
                fontWeight: 700,
                border: '1px solid rgba(0, 229, 255, 0.3)',
                mb: 2,
                px: 1,
              }}
            />
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.4rem', sm: '3.4rem', md: '4.2rem' },
                fontWeight: 900,
                lineHeight: 1.15,
                mb: 2,
              }}
            >
              Intelligent Car Buying, <br />
              <span style={{ color: '#00e5ff' }}>Engineered for You.</span>
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 400, fontSize: { xs: '1rem', md: '1.2rem' } }}>
              Ask in natural language, explore the interactive 3D cylindrical fleet, test aerodynamics, and lock down financing with transparent on-road pricing.
            </Typography>

            {/* Smart NLP Search Bar */}
            <Box
              component="form"
              onSubmit={handleSearchSubmit}
              sx={{
                mt: 3.5,
                display: 'flex',
                alignItems: 'center',
                p: 0.8,
                bgcolor: 'background.paper',
                borderRadius: '50px',
                border: '1px solid rgba(0, 229, 255, 0.35)',
                boxShadow: '0 8px 30px rgba(0, 229, 255, 0.15)',
                maxWidth: 680,
                mx: 'auto',
              }}
            >
              <TextField
                fullWidth
                variant="standard"
                placeholder="Ask CarIQ e.g. 'Safe automatic SUV under 20 lakh'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                slotProps={{
                  input: {
                    disableUnderline: true,
                    startAdornment: (
                      <InputAdornment position="start" sx={{ pl: 2 }}>
                        <SearchIcon sx={{ color: '#00e5ff' }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{ input: { fontSize: '1rem', py: 1.2 } }}
              />
              <Button
                type="submit"
                variant="contained"
                sx={{
                  borderRadius: '50px',
                  px: { xs: 2.5, sm: 4 },
                  py: 1.2,
                  whiteSpace: 'nowrap',
                  fontWeight: 700,
                }}
              >
                Ask AI
              </Button>
            </Box>

            {/* Quick Pills */}
            <Box sx={{ mt: 2.5, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', alignSelf: 'center', mr: 0.5 }}>
                Try asking:
              </Typography>
              {QUICK_SEARCH_PILLS.map((pill) => (
                <Chip
                  key={pill}
                  label={pill}
                  onClick={() => handlePillClick(pill)}
                  size="small"
                  sx={{
                    cursor: 'pointer',
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: 'rgba(0, 229, 255, 0.15)',
                      borderColor: '#00e5ff',
                      color: '#00e5ff',
                    },
                  }}
                />
              ))}
            </Box>

            {/* Scroll Down to Cylindrical Showroom Anchor Button */}
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={() => scrollToSection('cylinder-showroom')}
                endIcon={<KeyboardDoubleArrowDownIcon sx={{ animation: 'bounceDown 1.6s infinite ease-in-out' }} />}
                sx={{
                  borderColor: 'rgba(0, 229, 255, 0.4)',
                  color: '#00e5ff',
                  borderRadius: '30px',
                  px: 3,
                  py: 1,
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  letterSpacing: '0.04em',
                  backdropFilter: 'blur(8px)',
                  bgcolor: 'rgba(0, 229, 255, 0.05)',
                  boxShadow: '0 4px 20px rgba(0, 229, 255, 0.12)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#00e5ff',
                    bgcolor: 'rgba(0, 229, 255, 0.15)',
                    transform: 'translateY(2px)',
                    boxShadow: '0 6px 25px rgba(0, 229, 255, 0.25)',
                  },
                  '@keyframes bounceDown': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(5px)' },
                  },
                }}
              >
                Scroll Down to 3D Cylinder Showroom
              </Button>
            </Box>
          </Box>

          {/* 3D Cylindrical Car Carousel Showroom */}
          <Box id="cylinder-showroom" sx={{ mb: 10, scrollMarginTop: '80px' }}>
            <CylinderCarCarousel
              vehicles={vehicles}
              onSelectVehicle={onSelectVehicle}
              onStartPurchase={onStartPurchase}
            />
          </Box>

          {/* 3D Aerodynamics & Interior Customizer Studio */}
          <Box id="aerodynamics-studio" sx={{ mb: 10, scrollMarginTop: '80px' }}>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Chip
                  icon={<ViewInArIcon sx={{ fontSize: 16, color: '#00e5ff !important' }} />}
                  label="INTERACTIVE STUDIO"
                  size="small"
                  sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)', color: '#00e5ff', fontWeight: 700, mb: 0.5 }}
                />
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  Aerodynamics & Color Customizer
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Simulate wind tunnel airflow streams, inspect chassis geometry, and toggle exterior hues in real time.
                </Typography>
              </Box>
            </Box>
            <Car3DViewer />
          </Box>

          {/* Value Propositions Strip */}
          <Grid container spacing={3} sx={{ mb: 8 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '12px',
                      bgcolor: 'rgba(0, 229, 255, 0.1)',
                      color: '#00e5ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AutoAwesomeIcon />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    AI Multi-Factor Matching
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Our neural recommendation engine extracts your actual driving habits, luggage needs, and budget to calculate an objective match score.
                </Typography>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '12px',
                      bgcolor: 'rgba(0, 230, 118, 0.1)',
                      color: '#00e676',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <VerifiedIcon />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Verified Real-World Specs
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Bharat NCAP crash ratings, ARAI and user-reported fuel economy, ground clearance, and service costs without dealership bias.
                </Typography>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '12px',
                      bgcolor: 'rgba(255, 183, 3, 0.1)',
                      color: '#ffb703',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <SpeedIcon />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Digital Booking & Finance
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Interactive loan amortization calculator, instant KYC document upload, secure token deposit, and real-time delivery tracking.
                </Typography>
              </Card>
            </Grid>
          </Grid>

          {/* Featured Cars Section */}
          <Box sx={{ mb: 6 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#00e5ff', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  TOP RATED IN INDIA
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  Featured Vehicles
                </Typography>
              </Box>
              <Button
                variant="text"
                endIcon={<ArrowForwardIcon />}
                onClick={() => onNavigateToCatalog()}
                sx={{ color: '#00e5ff', fontWeight: 700 }}
              >
                View All Cars
              </Button>
            </Box>

            <Grid container spacing={3}>
              {vehicles.slice(0, 3).map((vehicle) => {
                const inWishlist = isInWishlist(vehicle.id);
                const inCompare = isInCompare(vehicle.id);

                return (
                  <Grid size={{ xs: 12, md: 4 }} key={vehicle.id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                      {/* Top Action Floating Icons */}
                      <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 5, display: 'flex', gap: 0.5 }}>
                        <Tooltip title={inCompare ? 'Remove from Compare' : 'Add to Compare'}>
                          <IconButton
                            size="small"
                            onClick={() => toggleCompare(vehicle)}
                            sx={{
                              bgcolor: inCompare ? '#00e5ff' : 'rgba(15, 23, 42, 0.7)',
                              color: inCompare ? '#000' : '#fff',
                              backdropFilter: 'blur(8px)',
                              '&:hover': { bgcolor: '#00e5ff', color: '#000' },
                            }}
                          >
                            <CompareArrowsIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}>
                          <IconButton
                            size="small"
                            onClick={() => (inWishlist ? removeFromWishlist(vehicle.id) : addToWishlist(vehicle))}
                            sx={{
                              bgcolor: inWishlist ? '#ff3366' : 'rgba(15, 23, 42, 0.7)',
                              color: '#fff',
                              backdropFilter: 'blur(8px)',
                              '&:hover': { bgcolor: '#ff3366' },
                            }}
                          >
                            {inWishlist ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </Box>

                      {/* Image */}
                      <CardMedia
                        component="img"
                        height="220"
                        image={vehicle.primary_image_url || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'}
                        alt={vehicle.model_name}
                        sx={{ objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => onSelectVehicle(vehicle)}
                      />

                      <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
                              {vehicle.brand?.name}
                            </Typography>
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 800, cursor: 'pointer', '&:hover': { color: '#00e5ff' } }}
                              onClick={() => onSelectVehicle(vehicle)}
                            >
                              {vehicle.model_name}
                            </Typography>
                          </Box>
                          <Chip
                            label={`${vehicle.safety_rating || 5}★ Safety`}
                            size="small"
                            sx={{ bgcolor: 'rgba(0, 230, 118, 0.15)', color: '#00e676', fontWeight: 700 }}
                          />
                        </Box>

                        {/* Specs row */}
                        <Box sx={{ display: 'flex', gap: 1.5, my: 2, flexWrap: 'wrap' }}>
                          <Chip
                            icon={<LocalGasStationIcon sx={{ fontSize: 16 }} />}
                            label={vehicle.fuel_type.toUpperCase()}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            icon={<SpeedIcon sx={{ fontSize: 16 }} />}
                            label={vehicle.transmission.toUpperCase()}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={vehicle.ev_range_km ? `${vehicle.ev_range_km} km Range` : `${vehicle.mileage_kmpl || 18.5} km/l`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>

                        {/* Price & Booking Button */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                          <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1 }}>
                              EX-SHOWROOM
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: '#00e5ff' }}>
                              ₹{(vehicle.ex_showroom_price / 100000).toFixed(2)} Lakh
                            </Typography>
                          </Box>

                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => onStartPurchase(vehicle)}
                            sx={{ fontWeight: 700 }}
                          >
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
    </Box>
  );
};
