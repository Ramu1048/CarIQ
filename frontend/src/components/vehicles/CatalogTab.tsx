import React, { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  TextField,
  InputAdornment,
  Slider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Chip,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Paper,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';
import CloseIcon from '@mui/icons-material/Close';
import CalculateIcon from '@mui/icons-material/Calculate';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AppsIcon from '@mui/icons-material/Apps';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';

import { Vehicle, VehicleSummary } from '../../types';
import { useWishlist } from '../../context/WishlistContext';

interface CatalogTabProps {
  vehicles: Vehicle[];
  onStartPurchase: (vehicle: Vehicle) => void;
  onNavigateToEMI: (price: number) => void;
  initialSearchQuery?: string;
}

const FUEL_OPTIONS = ['petrol', 'diesel', 'cng', 'ev', 'hybrid'];
const BODY_OPTIONS = ['suv', 'sedan', 'hatchback', 'muv'];
const TRANSMISSION_OPTIONS = ['manual', 'automatic'];

// Per-brand accent colors (professional light palette)
const BRAND_COLORS: Record<string, { accent: string; bg: string; border: string }> = {
  'Tata Motors':   { accent: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
  'Hyundai':       { accent: '#1e3a5f', bg: '#f0f6ff', border: '#c7d7eb' },
  'Maruti Suzuki': { accent: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  'Mahindra':      { accent: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  'Honda':         { accent: '#9f1239', bg: '#fff1f2', border: '#fecdd3' },
  'Toyota':        { accent: '#92400e', bg: '#fffbeb', border: '#fde68a' },
  'Kia':           { accent: '#0e7490', bg: '#ecfeff', border: '#a5f3fc' },
  'MG Motors':     { accent: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  'Volkswagen':    { accent: '#1e3a5f', bg: '#eff6ff', border: '#bfdbfe' },
  'Skoda':         { accent: '#065f46', bg: '#f0fdf4', border: '#bbf7d0' },
  'Renault':       { accent: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  'Jeep':          { accent: '#065f46', bg: '#f0fdf4', border: '#bbf7d0' },
};
const DEFAULT_COLOR = { accent: '#1e3a5f', bg: '#eff6ff', border: '#bfdbfe' };

export const CatalogTab: React.FC<CatalogTabProps> = ({
  vehicles,
  onStartPurchase,
  onNavigateToEMI,
  initialSearchQuery = '',
}) => {
  const { addToWishlist, removeFromWishlist, isInWishlist, toggleCompare, isInCompare } = useWishlist();

  // Phase: null = brand grid, string = brand name (or 'ALL')
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  const [search, setSearch] = useState(initialSearchQuery);
  const [priceRange, setPriceRange] = useState<number[]>([500000, 3500000]);
  const [selectedFuels, setSelectedFuels] = useState<string[]>([]);
  const [selectedBodies, setSelectedBodies] = useState<string[]>([]);
  const [selectedTransmissions, setSelectedTransmissions] = useState<string[]>([]);
  const [minSafety, setMinSafety] = useState<number>(0);
  const [sunroofOnly, setSunroofOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('popularity');
  const [selectedDetailVehicle, setSelectedDetailVehicle] = useState<Vehicle | null>(null);

  // Group vehicles by brand
  const brandMap = useMemo(() => {
    const map: Record<string, Vehicle[]> = {};
    vehicles.forEach((v) => {
      const b = v.brand?.name || 'Unknown';
      if (!map[b]) map[b] = [];
      map[b].push(v);
    });
    return map;
  }, [vehicles]);

  const brands = useMemo(() =>
    Object.entries(brandMap)
      .map(([name, cars]) => ({
        name,
        count: cars.length,
        minPrice: Math.min(...cars.map((c) => c.ex_showroom_price)),
        maxPrice: Math.max(...cars.map((c) => c.ex_showroom_price)),
        primaryImage: cars.sort((a, b) => (b.popularity_score || 0) - (a.popularity_score || 0))[0]?.primary_image_url || '/images/cars/creta.png',
        hasEV: cars.some((c) => c.fuel_type === 'ev' || c.fuel_type === 'electric'),
        maxSafety: Math.max(...cars.map((c) => c.safety_rating || 0)),
      }))
      .sort((a, b) => b.count - a.count),
    [brandMap]
  );

  const poolVehicles = useMemo(() => {
    if (!selectedBrand || selectedBrand === 'ALL') return vehicles;
    return brandMap[selectedBrand] || [];
  }, [vehicles, brandMap, selectedBrand]);

  const filteredVehicles = useMemo(() => {
    return poolVehicles
      .filter((v) => {
        if (search) {
          const q = search.toLowerCase();
          if (!v.model_name.toLowerCase().includes(q) && !v.brand.name.toLowerCase().includes(q)) return false;
        }
        if (v.ex_showroom_price < priceRange[0] || v.ex_showroom_price > priceRange[1]) return false;
        if (selectedFuels.length > 0 && !selectedFuels.includes(v.fuel_type.toLowerCase())) return false;
        if (selectedBodies.length > 0 && !selectedBodies.includes(v.body_type.toLowerCase())) return false;
        if (selectedTransmissions.length > 0 && !selectedTransmissions.includes(v.transmission.toLowerCase())) return false;
        if (minSafety > 0 && (v.safety_rating || 0) < minSafety) return false;
        if (sunroofOnly && !v.has_sunroof) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.ex_showroom_price - b.ex_showroom_price;
        if (sortBy === 'price_desc') return b.ex_showroom_price - a.ex_showroom_price;
        if (sortBy === 'mileage') return (b.mileage_kmpl || 0) - (a.mileage_kmpl || 0);
        if (sortBy === 'safety') return (b.safety_rating || 0) - (a.safety_rating || 0);
        return (b.popularity_score || 0) - (a.popularity_score || 0);
      });
  }, [poolVehicles, search, priceRange, selectedFuels, selectedBodies, selectedTransmissions, minSafety, sunroofOnly, sortBy]);

  const handleFuelToggle = (f: string) => setSelectedFuels((p) => p.includes(f) ? p.filter((x) => x !== f) : [...p, f]);
  const handleBodyToggle = (b: string) => setSelectedBodies((p) => p.includes(b) ? p.filter((x) => x !== b) : [...p, b]);
  const handleTransmissionToggle = (t: string) => setSelectedTransmissions((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t]);

  const clearFilters = () => {
    setSearch('');
    setPriceRange([500000, 3500000]);
    setSelectedFuels([]);
    setSelectedBodies([]);
    setSelectedTransmissions([]);
    setMinSafety(0);
    setSunroofOnly(false);
  };

  const handleBrandSelect = (name: string) => {
    setSelectedBrand(name);
    clearFilters();
  };

  const handleBack = () => {
    setSelectedBrand(null);
    clearFilters();
  };

  // ==========================================
  // PHASE 1 — BRAND GRID
  // ==========================================
  if (!selectedBrand) {
    return (
      <Container maxWidth="xl" sx={{ py: 6, bgcolor: '#f8fafc', minHeight: '100vh' }}>
        {/* Header */}
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Chip
            label="BROWSE BY MANUFACTURER"
            size="small"
            sx={{
              bgcolor: '#eff6ff',
              color: '#1e3a5f',
              fontWeight: 700,
              letterSpacing: 1.2,
              fontSize: '0.68rem',
              border: '1px solid #bfdbfe',
              mb: 2,
            }}
          />
          <Typography variant="h3" sx={{ fontWeight: 900, color: '#0f172a', mb: 1.5 }}>
            Discover by Brand
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', maxWidth: 500, mx: 'auto', lineHeight: 1.7 }}>
            Select a manufacturer to explore all its models, compare specs, and find your perfect car.
          </Typography>
        </Box>

        {/* All-brands tile */}
        <Box
          onClick={() => handleBrandSelect('ALL')}
          sx={{
            mb: 4,
            p: 3,
            borderRadius: '16px',
            bgcolor: '#ffffff',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 2px 12px rgba(15,23,42,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            '&:hover': {
              borderColor: '#1e3a5f',
              boxShadow: '0 8px 24px rgba(30,58,95,0.1)',
              transform: 'translateY(-2px)',
            },
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a9e 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AppsIcon sx={{ fontSize: 26, color: '#fff' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>All Brands</Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Browse all {vehicles.length} vehicles across {brands.length} manufacturers
            </Typography>
          </Box>
          <Chip label={`${vehicles.length} cars`} sx={{ bgcolor: '#eff6ff', color: '#1e3a5f', fontWeight: 700, border: '1px solid #bfdbfe' }} />
        </Box>

        {/* Brand cards */}
        <Grid container spacing={3}>
          {brands.map((brand) => {
            const c = BRAND_COLORS[brand.name] || DEFAULT_COLOR;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={brand.name}>
                <Box
                  onClick={() => handleBrandSelect(brand.name)}
                  sx={{
                    borderRadius: '20px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    position: 'relative',
                    bgcolor: '#ffffff',
                    border: `1.5px solid ${c.border}`,
                    boxShadow: '0 2px 10px rgba(15,23,42,0.05)',
                    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: `0 16px 40px ${c.border}88`,
                      borderColor: c.accent,
                    },
                    '&:hover .brand-img': { transform: 'scale(1.06)' },
                  }}
                >
                  {/* Car image area */}
                  <Box
                    sx={{
                      height: 170,
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: c.bg,
                    }}
                  >
                    <Box
                      component="img"
                      src={brand.primaryImage}
                      alt={brand.name}
                      className="brand-img"
                      onError={(e: any) => { e.target.onerror = null; e.target.src = '/images/cars/creta.png'; }}
                      sx={{
                        height: '85%',
                        maxWidth: '90%',
                        objectFit: 'contain',
                        transition: 'transform 0.4s ease',
                        filter: 'drop-shadow(0 8px 16px rgba(15,23,42,0.12))',
                      }}
                    />

                    {/* Model count badge */}
                    <Box sx={{ position: 'absolute', top: 12, right: 12, bgcolor: '#ffffff', border: `1px solid ${c.border}`, px: 1.2, py: 0.4, borderRadius: '20px', boxShadow: '0 1px 4px rgba(15,23,42,0.1)' }}>
                      <Typography sx={{ fontSize: '0.66rem', fontWeight: 700, color: c.accent }}>
                        {brand.count} {brand.count === 1 ? 'model' : 'models'}
                      </Typography>
                    </Box>

                    {/* EV badge */}
                    {brand.hasEV && (
                      <Box sx={{ position: 'absolute', top: 12, left: 12, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', px: 1, py: 0.3, borderRadius: '20px', display: 'flex', alignItems: 'center', gap: 0.4 }}>
                        <ElectricBoltIcon sx={{ fontSize: 11, color: '#10b981' }} />
                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#10b981' }}>EV</Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Brand info */}
                  <Box sx={{ px: 2.5, py: 2, borderTop: `1px solid ${c.border}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>
                        {brand.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                        <SecurityIcon sx={{ fontSize: 13, color: '#f59e0b' }} />
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#f59e0b' }}>
                          {brand.maxSafety}★
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.78rem', mb: 2 }}>
                      ₹{(brand.minPrice / 100000).toFixed(1)}L – ₹{(brand.maxPrice / 100000).toFixed(1)}L
                    </Typography>

                    <Box
                      sx={{
                        py: 1, textAlign: 'center', borderRadius: '10px',
                        bgcolor: c.bg,
                        border: `1px solid ${c.border}`,
                        '&:hover': { bgcolor: c.border },
                      }}
                    >
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: c.accent, letterSpacing: 0.6 }}>
                        EXPLORE {brand.count} VEHICLES →
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    );
  }

  // ==========================================
  // PHASE 2 — BRAND VEHICLES
  // ==========================================
  const bc = BRAND_COLORS[selectedBrand] || DEFAULT_COLOR;

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Back + Title row */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{
            color: '#1e3a5f', fontWeight: 700, mb: 2, px: 2, py: 0.8,
            borderRadius: '10px', bgcolor: '#eff6ff',
            border: '1px solid #bfdbfe',
            '&:hover': { bgcolor: '#dbeafe', borderColor: '#1e3a5f' },
          }}
        >
          All Brands
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a' }}>
              {selectedBrand === 'ALL' ? 'All Vehicles' : `${selectedBrand} Vehicles`}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.3 }}>
              Showing {filteredVehicles.length} of {poolVehicles.length} vehicles
            </Typography>
          </Box>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Sort By</InputLabel>
            <Select value={sortBy} label="Sort By" onChange={(e) => setSortBy(e.target.value)}>
              <MenuItem value="popularity">Most Popular</MenuItem>
              <MenuItem value="price_asc">Price: Low to High</MenuItem>
              <MenuItem value="price_desc">Price: High to Low</MenuItem>
              <MenuItem value="mileage">Highest Mileage</MenuItem>
              <MenuItem value="safety">Safety Rating</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Sidebar filters */}
        <Grid size={{ xs: 12, md: 3.5 }}>
          <Paper
            sx={{
              p: 3, borderRadius: '16px',
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 2px 12px rgba(15,23,42,0.06)',
              position: 'sticky', top: 90,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterListIcon sx={{ color: '#1e3a5f', fontSize: 20 }} /> Filters
              </Typography>
              <Button size="small" onClick={clearFilters} sx={{ color: '#64748b', fontWeight: 600, '&:hover': { color: '#1e3a5f' } }}>Reset</Button>
            </Box>

            <TextField
              fullWidth size="small" placeholder="Search model..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              slotProps={{ input: { startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: '#94a3b8' }} /></InputAdornment>) } }}
              sx={{ mb: 3 }}
            />

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: '#374151' }}>Price Range</Typography>
              <Slider
                value={priceRange} onChange={(_, v) => setPriceRange(v as number[])}
                min={500000} max={4000000} step={50000}
                valueLabelDisplay="auto" valueLabelFormat={(v) => `₹${(v / 100000).toFixed(1)}L`}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>₹{(priceRange[0] / 100000).toFixed(1)}L</Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>₹{(priceRange[1] / 100000).toFixed(1)}L</Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: '#374151' }}>Fuel Type</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                {FUEL_OPTIONS.map((fuel) => {
                  const sel = selectedFuels.includes(fuel);
                  return (
                    <Chip key={fuel} label={fuel.toUpperCase()} size="small" clickable onClick={() => handleFuelToggle(fuel)}
                      sx={{ bgcolor: sel ? '#1e3a5f' : '#f8fafc', color: sel ? '#fff' : '#475569', fontWeight: sel ? 700 : 500, border: sel ? '1px solid #1e3a5f' : '1px solid #e2e8f0', '&:hover': { borderColor: '#1e3a5f', color: sel ? '#fff' : '#1e3a5f' } }} />
                  );
                })}
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: '#374151' }}>Body Style</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                {BODY_OPTIONS.map((body) => {
                  const sel = selectedBodies.includes(body);
                  return (
                    <Chip key={body} label={body.toUpperCase()} size="small" clickable onClick={() => handleBodyToggle(body)}
                      sx={{ bgcolor: sel ? '#1e3a5f' : '#f8fafc', color: sel ? '#fff' : '#475569', fontWeight: sel ? 700 : 500, border: sel ? '1px solid #1e3a5f' : '1px solid #e2e8f0', '&:hover': { borderColor: '#1e3a5f', color: sel ? '#fff' : '#1e3a5f' } }} />
                  );
                })}
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: '#374151' }}>Transmission</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                {TRANSMISSION_OPTIONS.map((tr) => {
                  const sel = selectedTransmissions.includes(tr);
                  return (
                    <Chip key={tr} label={tr.toUpperCase()} size="small" clickable onClick={() => handleTransmissionToggle(tr)}
                      sx={{ bgcolor: sel ? '#1e3a5f' : '#f8fafc', color: sel ? '#fff' : '#475569', fontWeight: sel ? 700 : 500, border: sel ? '1px solid #1e3a5f' : '1px solid #e2e8f0', '&:hover': { borderColor: '#1e3a5f', color: sel ? '#fff' : '#1e3a5f' } }} />
                  );
                })}
              </Box>
            </Box>

            <FormGroup>
              <FormControlLabel
                control={<Checkbox checked={sunroofOnly} onChange={(e) => setSunroofOnly(e.target.checked)} sx={{ color: '#1e3a5f', '&.Mui-checked': { color: '#1e3a5f' } }} />}
                label={<Typography variant="body2" sx={{ color: '#374151' }}>Sunroof Only</Typography>}
              />
            </FormGroup>
          </Paper>
        </Grid>

        {/* Vehicle cards */}
        <Grid size={{ xs: 12, md: 8.5 }}>
          {filteredVehicles.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '20px' }}>
              <DirectionsCarIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>No Vehicles Found</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>Try loosening your filters.</Typography>
              <Button variant="outlined" onClick={clearFilters}>Clear All Filters</Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {filteredVehicles.map((vehicle) => {
                const inWishlist = isInWishlist(vehicle.id);
                const inCompare = isInCompare(vehicle.id);
                const isEV = vehicle.fuel_type === 'ev' || vehicle.fuel_type === 'electric';

                return (
                  <Grid size={{ xs: 12, sm: 6 }} key={vehicle.id}>
                    <Card
                      sx={{
                        height: '100%', display: 'flex', flexDirection: 'column',
                        position: 'relative', borderRadius: '16px',
                        border: '1.5px solid #e2e8f0',
                        transition: 'all 0.25s ease',
                        '&:hover': { borderColor: '#c7d7eb', boxShadow: '0 8px 28px rgba(30,58,95,0.1)', transform: 'translateY(-3px)' },
                      }}
                    >
                      {/* Floating icons */}
                      <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 5, display: 'flex', gap: 0.5 }}>
                        <Tooltip title={inCompare ? 'Remove from Compare' : 'Add to Compare'}>
                          <IconButton size="small" onClick={() => toggleCompare(vehicle)}
                            sx={{ bgcolor: inCompare ? '#1e3a5f' : 'rgba(255,255,255,0.92)', color: inCompare ? '#fff' : '#475569', boxShadow: '0 2px 6px rgba(15,23,42,0.12)', '&:hover': { bgcolor: '#1e3a5f', color: '#fff' } }}>
                            <CompareArrowsIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={inWishlist ? 'Remove from Wishlist' : 'Save to Wishlist'}>
                          <IconButton size="small" onClick={() => inWishlist ? removeFromWishlist(vehicle.id) : addToWishlist(vehicle)}
                            sx={{ bgcolor: inWishlist ? '#fef2f2' : 'rgba(255,255,255,0.92)', color: inWishlist ? '#ef4444' : '#475569', boxShadow: '0 2px 6px rgba(15,23,42,0.12)', '&:hover': { bgcolor: '#fef2f2', color: '#ef4444' } }}>
                            {inWishlist ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </Box>

                      {isEV && (
                        <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 5, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', px: 1, py: 0.3, borderRadius: '20px', display: 'flex', alignItems: 'center', gap: 0.4 }}>
                          <ElectricBoltIcon sx={{ fontSize: 11, color: '#10b981' }} />
                          <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#10b981' }}>EV</Typography>
                        </Box>
                      )}

                      <CardMedia
                        component="img" height="185"
                        image={vehicle.primary_image_url || '/images/cars/creta.png'}
                        alt={vehicle.model_name}
                        sx={{ objectFit: 'cover', cursor: 'pointer', bgcolor: '#f8fafc' }}
                        onClick={() => setSelectedDetailVehicle(vehicle)}
                        onError={(e: any) => { e.target.onerror = null; e.target.src = '/images/cars/creta.png'; }}
                      />

                      <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: 0.6 }}>
                            {vehicle.brand?.name}
                          </Typography>
                          <Chip label={`${vehicle.safety_rating || 5}★ Safety`} size="small"
                            sx={{ bgcolor: '#f0fdf4', color: '#10b981', fontWeight: 700, fontSize: '0.66rem', border: '1px solid #bbf7d0' }} />
                        </Box>

                        <Typography variant="h6" sx={{ fontWeight: 800, cursor: 'pointer', color: '#0f172a', '&:hover': { color: '#1e3a5f' } }}
                          onClick={() => setSelectedDetailVehicle(vehicle)}>
                          {vehicle.model_name}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, my: 1.5, flexWrap: 'wrap' }}>
                          <Chip icon={<LocalGasStationIcon sx={{ fontSize: 13 }} />} label={vehicle.fuel_type.toUpperCase()} size="small" variant="outlined" sx={{ fontSize: '0.68rem' }} />
                          <Chip icon={<SpeedIcon sx={{ fontSize: 13 }} />} label={vehicle.transmission.toUpperCase()} size="small" variant="outlined" sx={{ fontSize: '0.68rem' }} />
                          <Chip label={vehicle.ev_range_km ? `${vehicle.ev_range_km} km` : `${vehicle.mileage_kmpl || 18.5} km/l`} size="small" variant="outlined" sx={{ fontSize: '0.68rem' }} />
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, borderTop: '1px solid #f1f5f9' }}>
                          <Box>
                            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', lineHeight: 1, fontWeight: 600 }}>EX-SHOWROOM</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e3a5f' }}>
                              ₹{(vehicle.ex_showroom_price / 100000).toFixed(2)} Lakh
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button variant="outlined" size="small" onClick={() => setSelectedDetailVehicle(vehicle)}
                              sx={{ fontWeight: 600, borderColor: '#e2e8f0', color: '#475569', '&:hover': { borderColor: '#1e3a5f', color: '#1e3a5f' } }}>
                              Specs
                            </Button>
                            <Button variant="contained" size="small" onClick={() => onStartPurchase(vehicle)}
                              sx={{ fontWeight: 700 }}>
                              Book
                            </Button>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Grid>
      </Grid>

      {/* Vehicle Detail Modal */}
      <Dialog open={Boolean(selectedDetailVehicle)} onClose={() => setSelectedDetailVehicle(null)} maxWidth="md" fullWidth
        slotProps={{ paper: { sx: { borderRadius: '20px', bgcolor: '#ffffff', border: '1.5px solid #e2e8f0', p: 1 } } }}>
        {selectedDetailVehicle && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {selectedDetailVehicle.brand?.name}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>{selectedDetailVehicle.model_name}</Typography>
              </Box>
              <IconButton onClick={() => setSelectedDetailVehicle(null)} sx={{ color: '#64748b' }}><CloseIcon /></IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ borderColor: '#f1f5f9' }}>
              <Box component="img" src={selectedDetailVehicle.primary_image_url} alt={selectedDetailVehicle.model_name}
                onError={(e: any) => { e.target.onerror = null; e.target.src = '/images/cars/creta.png'; }}
                sx={{ width: '100%', height: 240, objectFit: 'cover', borderRadius: '14px', mb: 3, bgcolor: '#f8fafc' }} />

              <Typography variant="body1" sx={{ color: '#475569', mb: 3, lineHeight: 1.7 }}>
                {selectedDetailVehicle.description || "India's benchmark vehicle in its segment offering cutting-edge convenience, advanced driver assistance systems, and exceptional safety engineering."}
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#0f172a' }}>Technical Specifications</Typography>
              <Table size="small" sx={{ mb: 3 }}>
                <TableBody>
                  <TableRow sx={{ '&:nth-of-type(odd)': { bgcolor: '#f8fafc' } }}>
                    <TableCell sx={{ fontWeight: 600, color: '#64748b', border: 'none', py: 1.2 }}>Ex-Showroom Price</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1e3a5f', border: 'none' }}>₹{(selectedDetailVehicle.ex_showroom_price / 100000).toFixed(2)} Lakh</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#64748b', border: 'none' }}>Approx. On-Road Price</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0f172a', border: 'none' }}>₹{((selectedDetailVehicle.on_road_price_approx || selectedDetailVehicle.ex_showroom_price * 1.15) / 100000).toFixed(2)} Lakh</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: '#64748b', border: 'none', py: 1.2 }}>Fuel Type</TableCell>
                    <TableCell sx={{ textTransform: 'uppercase', fontWeight: 600, border: 'none' }}>{selectedDetailVehicle.fuel_type}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#64748b', border: 'none' }}>Transmission</TableCell>
                    <TableCell sx={{ textTransform: 'uppercase', fontWeight: 600, border: 'none' }}>{selectedDetailVehicle.transmission}</TableCell>
                  </TableRow>
                  <TableRow sx={{ '&:nth-of-type(odd)': { bgcolor: '#f8fafc' } }}>
                    <TableCell sx={{ fontWeight: 600, color: '#64748b', border: 'none', py: 1.2 }}>Safety Benchmark</TableCell>
                    <TableCell sx={{ color: '#10b981', fontWeight: 700, border: 'none' }}>{selectedDetailVehicle.safety_rating || 5}★ Crash Tested</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#64748b', border: 'none' }}>Seating Capacity</TableCell>
                    <TableCell sx={{ fontWeight: 600, border: 'none' }}>{selectedDetailVehicle.seating_capacity} Persons</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: '#64748b', border: 'none', py: 1.2 }}>Horsepower & Torque</TableCell>
                    <TableCell sx={{ fontWeight: 600, border: 'none' }}>{selectedDetailVehicle.horsepower || 140} HP • {selectedDetailVehicle.torque_nm || 220} Nm</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#64748b', border: 'none' }}>Ground Clearance</TableCell>
                    <TableCell sx={{ fontWeight: 600, border: 'none' }}>{selectedDetailVehicle.ground_clearance_mm || 190} mm</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: '1px solid #f1f5f9' }}>
                <Button variant="outlined" startIcon={<CalculateIcon />}
                  onClick={() => { onNavigateToEMI(selectedDetailVehicle.ex_showroom_price); setSelectedDetailVehicle(null); }}>
                  Calculate EMI
                </Button>
                <Button variant="contained" size="large"
                  onClick={() => { const v = selectedDetailVehicle; setSelectedDetailVehicle(null); onStartPurchase(v); }}
                  sx={{ fontWeight: 700, px: 4 }}>
                  Book This Vehicle
                </Button>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Container>
  );
};

