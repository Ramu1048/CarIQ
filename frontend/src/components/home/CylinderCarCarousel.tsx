import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Chip,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SpeedIcon from '@mui/icons-material/Speed';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import SecurityIcon from '@mui/icons-material/Security';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import SettingsIcon from '@mui/icons-material/Settings';
import StarIcon from '@mui/icons-material/Star';

import { Vehicle } from '../../types';
import { useWishlist } from '../../context/WishlistContext';

interface CylinderCarCarouselProps {
  vehicles: Vehicle[];
  onSelectVehicle: (vehicle: Vehicle) => void;
  onStartPurchase: (vehicle: Vehicle) => void;
}

const AUTO_PLAY_INTERVAL = 4500;

export const CylinderCarCarousel: React.FC<CylinderCarCarouselProps> = ({
  vehicles,
  onSelectVehicle,
  onStartPurchase,
}) => {
  const { toggleCompare, isInCompare } = useWishlist();

  const featuredCars = vehicles.slice(0, 12);
  const total = featuredCars.length || 1;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [animating, setAnimating] = useState(false);

  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoPlayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Touch / drag state
  const touchStartX = useRef(0);
  const isDragging = useRef(false);

  const goTo = useCallback(
    (idx: number, dir: 'next' | 'prev' = 'next') => {
      if (animating) return;
      setDirection(dir);
      setAnimating(true);
      setProgress(0);
      setTimeout(() => {
        setActiveIndex((idx + total) % total);
        setAnimating(false);
      }, 420);
    },
    [animating, total]
  );

  const goNext = useCallback(() => {
    goTo(activeIndex + 1, 'next');
  }, [activeIndex, goTo]);

  const goPrev = useCallback(() => {
    goTo(activeIndex - 1, 'prev');
  }, [activeIndex, goTo]);

  // Auto-play progress bar
  useEffect(() => {
    if (!isAutoPlaying) {
      setProgress(0);
      if (progressRef.current) clearInterval(progressRef.current);
      return;
    }
    setProgress(0);
    const step = 100 / (AUTO_PLAY_INTERVAL / 80);
    progressRef.current = setInterval(() => {
      setProgress((p) => Math.min(p + step, 100));
    }, 80);
    autoPlayRef.current = setTimeout(() => {
      goNext();
    }, AUTO_PLAY_INTERVAL);

    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
      if (autoPlayRef.current) clearTimeout(autoPlayRef.current);
    };
  }, [isAutoPlaying, activeIndex, goNext]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isDragging.current = true;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -50) goNext();
    else if (delta > 50) goPrev();
    isDragging.current = false;
  };

  const activeCar = featuredCars[activeIndex];
  if (!activeCar) return null;

  const isEV = activeCar.fuel_type === 'ev' || activeCar.fuel_type === 'electric';

  return (
    <Box
      sx={{
        my: 4,
        borderRadius: { xs: 0, md: '28px' },
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
        border: '1px solid #e2e8f0',
        boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)',
        position: 'relative',
      }}
    >
      {/* Ambient glow blobs */}
      <Box
        sx={{
          position: 'absolute',
          top: '-80px',
          left: '-80px',
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-60px',
          right: '-60px',
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Section Header */}
      <Box
        sx={{
          px: { xs: 3, md: 5 },
          pt: { xs: 3, md: 4 },
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box>
          <Chip
            label="🔥 FEATURED VEHICLES"
            size="small"
            sx={{
              bgcolor: '#eff6ff',
              color: '#1e3a5f',
              fontWeight: 800,
              letterSpacing: 1.5,
              fontSize: '0.68rem',
              border: '1px solid #bfdbfe',
              mb: 1,
            }}
          />
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              fontSize: { xs: '1.5rem', md: '2rem' },
              background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.2,
            }}
          >
            Top Picks for You
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            {activeIndex + 1} of {total} vehicles — swipe or use arrows
          </Typography>
        </Box>

        {/* Auto-play toggle */}
        <Button
          size="small"
          variant="outlined"
          onClick={() => setIsAutoPlaying((p) => !p)}
          startIcon={isAutoPlaying ? <PauseIcon /> : <PlayArrowIcon />}
          sx={{
            borderColor: '#cbd5e1',
            color: '#1e3a5f',
            borderRadius: 50,
            fontSize: '0.75rem',
            fontWeight: 700,
            px: 2,
            py: 0.7,
            bgcolor: '#ffffff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            '&:hover': { borderColor: '#1e3a5f', bgcolor: '#eff6ff' },
          }}
        >
          {isAutoPlaying ? 'Pause' : 'Auto'}
        </Button>
      </Box>

      {/* Progress Bar */}
      {isAutoPlaying && (
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 3,
            bgcolor: '#e2e8f0',
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(90deg, #1e3a5f, #2563eb)',
              borderRadius: 1,
            },
          }}
        />
      )}

      {/* Main Card Showcase */}
      <Box
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          minHeight: { xs: 'auto', md: 400 },
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Left: Car Image Panel */}
        <Box
          sx={{
            flex: { xs: 'none', md: '0 0 55%' },
            position: 'relative',
            minHeight: { xs: 240, sm: 300, md: 400 },
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%)',
          }}
        >
          {/* Animated car image */}
          <Box
            key={`img-${activeIndex}-${direction}`}
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: { xs: 3, md: 5 },
              animation: `${direction === 'next' ? 'carSlideFromRight' : 'carSlideFromLeft'} 0.42s cubic-bezier(0.22, 1, 0.36, 1) both`,
              '@keyframes carSlideFromRight': {
                '0%': { opacity: 0, transform: 'translateX(70px) scale(0.94)' },
                '100%': { opacity: 1, transform: 'translateX(0) scale(1)' },
              },
              '@keyframes carSlideFromLeft': {
                '0%': { opacity: 0, transform: 'translateX(-70px) scale(0.94)' },
                '100%': { opacity: 1, transform: 'translateX(0) scale(1)' },
              },
            }}
          >
            <Box
              component="img"
              src={activeCar.primary_image_url || '/images/cars/creta.png'}
              alt={activeCar.model_name}
              onError={(e: any) => {
                e.target.onerror = null;
                e.target.src = '/images/cars/creta.png';
              }}
              sx={{
                maxHeight: { xs: 190, sm: 250, md: 300 },
                maxWidth: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 20px 25px rgba(15,23,42,0.12))',
              }}
            />
          </Box>

          {/* Brand chip */}
          <Box sx={{ position: 'absolute', top: 20, left: 20, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={activeCar.brand?.name || 'CarIQ'}
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.92)',
                color: '#0f172a',
                fontWeight: 700,
                fontSize: '0.72rem',
                border: '1px solid #cbd5e1',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                backdropFilter: 'blur(8px)',
              }}
            />
            {isEV && (
              <Chip
                icon={<ElectricBoltIcon sx={{ fontSize: '13px !important', color: '#059669 !important' }} />}
                label="EV"
                size="small"
                sx={{
                  bgcolor: '#ecfdf5',
                  color: '#059669',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  border: '1px solid #a7f3d0',
                  backdropFilter: 'blur(8px)',
                }}
              />
            )}
          </Box>

          {/* Bottom gradient overlay */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 80,
              background: 'linear-gradient(to top, #edf2f7 0%, transparent 100%)',
              pointerEvents: 'none',
            }}
          />
        </Box>

        {/* Right: Details Panel */}
        <Box
          key={`info-${activeIndex}-${direction}`}
          sx={{
            flex: 1,
            p: { xs: 3, md: 4 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderLeft: { md: '1px solid #e2e8f0' },
            animation: `${direction === 'next' ? 'infoSlideUp' : 'infoSlideDown'} 0.45s cubic-bezier(0.22, 1, 0.36, 1) both`,
            '@keyframes infoSlideUp': {
              '0%': { opacity: 0, transform: 'translateY(28px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' },
            },
            '@keyframes infoSlideDown': {
              '0%': { opacity: 0, transform: 'translateY(-28px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                fontSize: { xs: '1.6rem', md: '2rem' },
                color: '#0f172a',
                lineHeight: 1.15,
                mb: 0.5,
              }}
            >
              {activeCar.model_name}
            </Typography>
            {(activeCar as any).tagline && (
              <Typography variant="body2" sx={{ color: '#64748b', mb: 1.5, fontStyle: 'italic' }}>
                "{(activeCar as any).tagline}"
              </Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 2 }}>
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: '1.5rem', md: '1.75rem' },
                  background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                ₹{(activeCar.ex_showroom_price / 100000).toFixed(2)} L
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                ex-showroom
              </Typography>
            </Box>

            {/* Star rating */}
            {activeCar.safety_rating != null && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon
                    key={i}
                    sx={{
                      fontSize: 15,
                      color: i < Math.floor(activeCar.safety_rating!) ? '#fbbf24' : '#e2e8f0',
                    }}
                  />
                ))}
                <Typography variant="caption" sx={{ color: '#64748b', ml: 0.5 }}>
                  {activeCar.safety_rating} NCAP
                </Typography>
              </Box>
            )}

            {/* Key Specs 2x2 Grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.2, mb: 3 }}>
              <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.4 }}>
                  {isEV ? <ElectricBoltIcon sx={{ fontSize: 13, color: '#059669' }} /> : <LocalGasStationIcon sx={{ fontSize: 13, color: '#fbbf24' }} />}
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    {isEV ? 'Range' : 'Mileage'}
                  </Typography>
                </Box>
                <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                  {isEV ? `${activeCar.ev_range_km || 420} km` : `${activeCar.mileage_kmpl || '--'} km/l`}
                </Typography>
              </Box>

              {activeCar.horsepower != null && (
                <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.4 }}>
                    <SpeedIcon sx={{ fontSize: 13, color: '#1e3a5f' }} />
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.8 }}>Power</Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{activeCar.horsepower} bhp</Typography>
                </Box>
              )}

              <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.4 }}>
                  <SettingsIcon sx={{ fontSize: 13, color: '#6366f1' }} />
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.8 }}>Gearbox</Typography>
                </Box>
                <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem', textTransform: 'capitalize' }}>{activeCar.transmission}</Typography>
              </Box>

              <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.4 }}>
                  <SecurityIcon sx={{ fontSize: 13, color: '#059669' }} />
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.8 }}>Airbags</Typography>
                </Box>
                <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{(activeCar as any).num_airbags || 6} Airbags</Typography>
              </Box>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="medium"
              onClick={() => onSelectVehicle(activeCar)}
              startIcon={<InfoOutlinedIcon />}
              sx={{
                flex: 1,
                minWidth: 120,
                py: 1,
                fontWeight: 800,
                fontSize: '0.8rem',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
                boxShadow: '0 4px 15px rgba(30,58,95,0.2)',
                color: '#ffffff',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(30,58,95,0.3)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              View Details
            </Button>

            <Tooltip title={isInCompare(activeCar.id) ? 'Remove from Compare' : 'Add to Compare'}>
              <IconButton
                onClick={() => toggleCompare(activeCar)}
                sx={{
                  bgcolor: isInCompare(activeCar.id) ? '#eff6ff' : '#ffffff',
                  color: isInCompare(activeCar.id) ? '#1e3a5f' : '#64748b',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  '&:hover': { bgcolor: '#eff6ff', color: '#1e3a5f' },
                  transition: 'all 0.2s ease',
                }}
              >
                <CompareArrowsIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Book Test Drive">
              <IconButton
                onClick={() => onStartPurchase(activeCar)}
                sx={{
                  bgcolor: '#fffbeb',
                  color: '#d97706',
                  border: '1px solid #fde68a',
                  borderRadius: '10px',
                  '&:hover': { bgcolor: '#fef3c7', transform: 'scale(1.05)' },
                  transition: 'all 0.2s ease',
                }}
              >
                <ShoppingBagIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Bottom Navigation Row — dots + arrows */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 3, md: 5 },
          py: 2.5,
          borderTop: '1px solid #e2e8f0',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Dot indicators with animated active pill */}
        <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center', flexWrap: 'wrap' }}>
          {featuredCars.map((car, i) => (
            <Box
              key={car.id || i}
              onClick={() => goTo(i, i > activeIndex ? 'next' : 'prev')}
              sx={{
                width: i === activeIndex ? 28 : 8,
                height: 8,
                borderRadius: 50,
                bgcolor: i === activeIndex ? '#1e3a5f' : '#cbd5e1',
                cursor: 'pointer',
                transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': { bgcolor: i === activeIndex ? '#1e3a5f' : '#94a3b8' },
              }}
            />
          ))}
        </Box>

        {/* Prev / Next arrows */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={goPrev}
            size="small"
            sx={{
              bgcolor: '#ffffff',
              color: '#1e3a5f',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              '&:hover': { bgcolor: '#eff6ff', color: '#1e3a5f', borderColor: '#bfdbfe' },
              transition: 'all 0.2s ease',
            }}
          >
            <ArrowBackIosNewIcon sx={{ fontSize: 15 }} />
          </IconButton>
          <IconButton
            onClick={goNext}
            size="small"
            sx={{
              bgcolor: '#ffffff',
              color: '#1e3a5f',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              '&:hover': { bgcolor: '#eff6ff', color: '#1e3a5f', borderColor: '#bfdbfe' },
              transition: 'all 0.2s ease',
            }}
          >
            <ArrowForwardIosIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Horizontal Thumbnail Strip — cars one after another */}
      <Box
        sx={{
          px: { xs: 2, md: 4 },
          pb: 3,
          display: 'flex',
          gap: 1.5,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          position: 'relative',
          zIndex: 1,
        }}
      >
        {featuredCars.map((car, i) => (
          <Box
            key={car.id || i}
            onClick={() => goTo(i, i > activeIndex ? 'next' : 'prev')}
            sx={{
              flexShrink: 0,
              width: { xs: 95, sm: 115, md: 132 },
              height: { xs: 70, sm: 80, md: 88 },
              borderRadius: '12px',
              overflow: 'hidden',
              cursor: 'pointer',
              position: 'relative',
              border: i === activeIndex ? '2px solid #1e3a5f' : '1px solid #e2e8f0',
              boxShadow: i === activeIndex ? '0 4px 14px rgba(30,58,95,0.15)' : 'none',
              transition: 'all 0.3s ease',
              bgcolor: '#ffffff',
              '&:hover': {
                border: '2px solid #2563eb',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <Box
              component="img"
              src={car.primary_image_url || '/images/cars/creta.png'}
              alt={car.model_name}
              onError={(e: any) => {
                e.target.onerror = null;
                e.target.src = '/images/cars/creta.png';
              }}
              sx={{
                width: '100%',
                height: '68%',
                objectFit: 'contain',
                p: 0.5,
                pt: 0.8,
                filter: i === activeIndex ? 'none' : 'grayscale(30%) opacity(0.7)',
                transition: 'filter 0.3s ease',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                py: 0.35,
                px: 0.8,
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                borderTop: '1px solid #f1f5f9',
                backdropFilter: 'blur(4px)',
              }}
            >
              <Typography
                noWrap
                sx={{
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  color: i === activeIndex ? '#1e3a5f' : '#475569',
                  textAlign: 'center',
                }}
              >
                {car.model_name}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

