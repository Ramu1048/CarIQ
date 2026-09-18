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

// Per-brand accent colors
const BRAND_COLORS: Record<string, { from: string; to: string; border: string }> = {
  'Tata Motors':   { from: '#0f2d6e', to: '#1a4599', border: '#3b82f6' },
  'Hyundai':       { from: '#002c5f', to: '#003f85', border: '#60a5fa' },
  'Maruti Suzuki': { from: '#1a1a2e', to: '#16213e', border: '#f87171' },
  'Mahindra':      { from: '#6b0000', to: '#9b1515', border: '#ef4444' },
  'Honda':         { from: '#7b0000', to: '#cc0000', border: '#fca5a5' },
  'Toyota':        { from: '#1a0a00', to: '#3d1a00', border: '#fbbf24' },
  'Kia':           { from: '#05141f', to: '#0a2540', border: '#22d3ee' },
  'MG Motors':     { from: '#4a0f14', to: '#7a1520', border: '#fb7185' },
  'Volkswagen':    { from: '#001030', to: '#001e50', border: '#a5b4fc' },
  'Skoda':         { from: '#0a1f0a', to: '#1e4620', border: '#4ade80' },
  'Renault':       { from: '#1a1400', to: '#2e2400', border: '#fde047' },
  'Jeep':          { from: '#0d1b2a', to: '#1b2e45', border: '#34d399' },
};
const DEFAULT_COLOR = { from: '#0f172a', to: '#1e293b', border: '#63b3ed' };

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

  // â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
  // PHASE 1 â€” BRAND GRID
  // â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
  if (!selectedBrand) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 5, textAlign: 'center' }}>
          <Chip
            label="ðŸ­ CHOOSE A BRAND"
            size="small"
            sx={{
              bgcolor: 'rgba(99,179,237,0.12)',
              color: '#63b3ed',
              fontWeight: 800,
              letterSpacing: 1.5,
              fontSize: '0.7rem',
              border: '1px solid rgba(99,179,237,0.25)',
              mb: 1.5,
            }}
          />
          <Typography
            variant="h3"
            sx={{
              fontWeight: 900,
              background: 'linear-gradient(135deg, #ffffff 0%, #63b3ed 60%, #a855f7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
            }}
          >
            Discover by Brand
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', maxWidth: 520, mx: 'auto' }}>
            Select a manufacturer to explore all its models, compare specs, and find your perfect car.
          </Typography>
        </Box>

        {/* All-brands tile */}
        <Box
          onClick={() => handleBrandSelect('ALL')}
          sx={{
            mb: 3,
            p: 3,
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: '1px solid rgba(99,179,237,0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            '&:hover': {
              border: '1px solid #63b3ed',
              boxShadow: '0 0 30px rgba(99,179,237,0.12)',
              transform: 'translateY(-2px)',
            },
          }}
        >
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AppsIcon sx={{ fontSize: 28, color: '#fff' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#f1f5f9' }}>All Brands</Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Browse all {vehicles.length} vehicles across {brands.length} manufacturers
            </Typography>
          </Box>
          <Chip
            label={`${vehicles.length} cars`}
            sx={{ bgcolor: 'rgba(99,179,237,0.12)', color: '#63b3ed', fontWeight: 700 }}
          />
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
                    borderRadius: '24px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    position: 'relative',
                    border: `1px solid ${c.border}28`,
                    background: `linear-gradient(135deg, ${c.from} 0%, ${c.to} 100%)`,
                    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      border: `1px solid ${c.border}70`,
                      boxShadow: `0 16px 48px ${c.border}22`,
                    },
                    '&:hover .brand-img': { transform: 'scale(1.08) translateX(-5px)' },
                  }}
                >
                  {/* Car image area */}
                  <Box
                    sx={{
                      height: 165,
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `radial-gradient(circle at 70% 50%, ${c.border}12 0%, transparent 70%)`,
                    }}
                  >
                    <Box
                      component="img"
                      src={brand.primaryImage}
                      alt={brand.name}
                      className="brand-img"
                      onError={(e: any) => { e.target.onerror = null; e.target.src = '/images/cars/creta.png'; }}
                      sx={{
                        height: '88%',
                        maxWidth: '88%',
                        objectFit: 'contain',
                        transition: 'transform 0.4s ease',
                        filter: `drop-shadow(0 10px 24px ${c.border}40)`,
                      }}
                    />

                    {/* Model count badge */}
                    <Box
                      sx={{
                        position: 'absolute', top: 12, right: 12,
                        bgcolor: `${c.border}22`, backdropFilter: 'blur(8px)',
                        border: `1px solid ${c.border}38`, px: 1.2, py: 0.4, borderRadius: '20px',
                      }}
                    >
                      <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: c.border }}>
                        {brand.count} {brand.count === 1 ? 'model' : 'models'}
                      </Typography>
                    </Box>

                    {/* EV badge */}
                    {brand.hasEV && (
                      <Box
                        sx={{
                          position: 'absolute', top: 12, left: 12,
                          bgcolor: 'rgba(74,222,128,0.14)', border: '1px solid rgba(74,222,128,0.38)',
                          px: 1, py: 0.3, borderRadius: '20px',
                          display: 'flex', alignItems: 'center', gap: 0.4,
                        }}
                      >
                        <ElectricBoltIcon sx={{ fontSize: 11, color: '#4ade80' }} />
                        <Typography sx={{ fontSize: '0.64rem', fontWeight: 800, color: '#4ade80' }}>EV</Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Brand info */}
                  <Box sx={{ px: 2.5, py: 2, borderTop: `1px solid ${c.border}18` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.6 }}>
                      <Typography variant="h6" sx={{ fontWeight: 900, color: '#f1f5f9', fontSize: '1.05rem' }}>
                        {brand.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                        <SecurityIcon sx={{ fontSize: 13, color: '#fbbf24' }} />
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#fbbf24' }}>
                          {brand.maxSafety}â˜…
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.78rem', mb: 2 }}>
                      â‚¹{(brand.minPrice / 100000).toFixed(1)}L â€“ â‚¹{(brand.maxPrice / 100000).toFixed(1)}L
                    </Typography>

                    <Box
                      sx={{
                        py: 0.9, textAlign: 'center', borderRadius: '10px',
                        background: `linear-gradient(135deg, ${c.border}16, ${c.border}06)`,
                        border: `1px solid ${c.border}28`,
                        '&:hover': { background: `linear-gradient(135deg, ${c.border}28, ${c.border}12)` },
                      }}
                    >
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: c.border, letterSpacing: 0.8 }}>
                        EXPLORE {brand.count} VEHICLES â†’
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

  // â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
  // PHASE 2 â€” BRAND VEHICLES
  // â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
  const bc = BRAND_COLORS[selectedBrand] || DEFAULT_COLOR;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Back + Title row */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{
            color: '#63b3ed', fontWeight: 700, mb: 2, px: 2, py: 0.8,
            borderRadius: '10px', bgcolor: 'rgba(99,179,237,0.08)',
            border: '1px solid rgba(99,179,237,0.2)',
            '&:hover': { bgcolor: 'rgba(99,179,237,0.15)' },
          }}
        >
          All Brands
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                background: selectedBrand === 'ALL'
                  ? 'linear-gradient(135deg, #ffffff 0%, #63b3ed 100%)'
                  : `linear-gradient(135deg, #ffffff 0%, ${bc.border} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
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
              p: 3, borderRadius: '20px',
              border: `1px solid ${bc.border}22`,
              position: 'sticky', top: 90,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterListIcon sx={{ color: bc.border }} /> Filters
              </Typography>
              <Button size="small" onClick={clearFilters} sx={{ color: bc.border }}>Reset All</Button>
            </Box>

            <TextField
              fullWidth size="small" placeholder="Search model..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              slotProps={{ input: { startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: '#94a3b8' }} /></InputAdornment>) } }}
              sx={{ mb: 3 }}
            />

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Price Range</Typography>
              <Slider
                value={priceRange} onChange={(_, v) => setPriceRange(v as number[])}
                min={500000} max={4000000} step={50000}
                valueLabelDisplay="auto" valueLabelFormat={(v) => `â‚¹${(v / 100000).toFixed(1)}L`}
                sx={{ color: bc.border }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>â‚¹{(priceRange[0] / 100000).toFixed(1)}L</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>â‚¹{(priceRange[1] / 100000).toFixed(1)}L</Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Fuel Type</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                {FUEL_OPTIONS.map((fuel) => {
                  const sel = selectedFuels.includes(fuel);
                  return (
                    <Chip key={fuel} label={fuel.toUpperCase()} size="small" clickable onClick={() => handleFuelToggle(fuel)}
                      sx={{ bgcolor: sel ? bc.border : 'rgba(255,255,255,0.05)', color: sel ? '#000' : 'text.primary', fontWeight: sel ? 700 : 500, border: sel ? `1px solid ${bc.border}` : '1px solid rgba(255,255,255,0.1)' }} />
                  );
                })}
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Body Style</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                {BODY_OPTIONS.map((body) => {
                  const sel = selectedBodies.includes(body);
                  return (
                    <Chip key={body} label={body.toUpperCase()} size="small" clickable onClick={() => handleBodyToggle(body)}
                      sx={{ bgcolor: sel ? bc.border : 'rgba(255,255,255,0.05)', color: sel ? '#000' : 'text.primary', fontWeight: sel ? 700 : 500, border: sel ? `1px solid ${bc.border}` : '1px solid rgba(255,255,255,0.1)' }} />
                  );
                })}
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Transmission</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                {TRANSMISSION_OPTIONS.map((tr) => {
                  const sel = selectedTransmissions.includes(tr);
                  return (
                    <Chip key={tr} label={tr.toUpperCase()} size="small" clickable onClick={() => handleTransmissionToggle(tr)}
                      sx={{ bgcolor: sel ? bc.border : 'rgba(255,255,255,0.05)', color: sel ? '#000' : 'text.primary', fontWeight: sel ? 700 : 500, border: sel ? `1px solid ${bc.border}` : '1px solid rgba(255,255,255,0.1)' }} />
                  );
                })}
              </Box>
            </Box>

            <FormGroup>
              <FormControlLabel
                control={<Checkbox checked={sunroofOnly} onChange={(e) => setSunroofOnly(e.target.checked)} sx={{ color: bc.border, '&.Mui-checked': { color: bc.border } }} />}
                label={<Typography variant="body2">Sunroof Only</Typography>}
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
                        position: 'relative', borderRadius: '20px',
                        border: `1px solid ${bc.border}18`,
                        transition: 'all 0.25s ease',
                        '&:hover': { border: `1px solid ${bc.border}55`, boxShadow: `0 8px 32px ${bc.border}12`, transform: 'translateY(-3px)' },
                      }}
                    >
                      {/* Floating icons */}
                      <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 5, display: 'flex', gap: 0.5 }}>
                        <Tooltip title={inCompare ? 'Remove from Compare' : 'Add to Compare'}>
                          <IconButton size="small" onClick={() => toggleCompare(vehicle)}
                            sx={{ bgcolor: inCompare ? bc.border : 'rgba(15,23,42,0.75)', color: inCompare ? '#000' : '#fff', backdropFilter: 'blur(8px)', '&:hover': { bgcolor: bc.border, color: '#000' } }}>
                            <CompareArrowsIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}>
                          <IconButton size="small" onClick={() => inWishlist ? removeFromWishlist(vehicle.id) : addToWishlist(vehicle)}
                            sx={{ bgcolor: inWishlist ? '#ff3366' : 'rgba(15,23,42,0.75)', color: '#fff', backdropFilter: 'blur(8px)', '&:hover': { bgcolor: '#ff3366' } }}>
                            {inWishlist ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </Box>

                      {isEV && (
                        <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 5, bgcolor: 'rgba(74,222,128,0.14)', border: '1px solid rgba(74,222,128,0.38)', px: 1, py: 0.3, borderRadius: '20px', display: 'flex', alignItems: 'center', gap: 0.4 }}>
                          <ElectricBoltIcon sx={{ fontSize: 11, color: '#4ade80' }} />
                          <Typography sx={{ fontSize: '0.64rem', fontWeight: 800, color: '#4ade80' }}>EV</Typography>
                        </Box>
                      )}

                      <CardMedia
                        component="img" height="190"
                        image={vehicle.primary_image_url || '/images/cars/creta.png'}
                        alt={vehicle.model_name}
                        sx={{ objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => setSelectedDetailVehicle(vehicle)}
                        onError={(e: any) => { e.target.onerror = null; e.target.src = '/images/cars/creta.png'; }}
                      />

                      <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ color: bc.border, fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                            {vehicle.brand?.name}
                          </Typography>
                          <Chip label={`${vehicle.safety_rating || 5}â˜… Safety`} size="small"
                            sx={{ bgcolor: 'rgba(0,230,118,0.12)', color: '#00e676', fontWeight: 700, fontSize: '0.68rem' }} />
                        </Box>

                        <Typography variant="h6" sx={{ fontWeight: 800, cursor: 'pointer', '&:hover': { color: bc.border } }}
                          onClick={() => setSelectedDetailVehicle(vehicle)}>
                          {vehicle.model_name}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, my: 1.5, flexWrap: 'wrap' }}>
                          <Chip icon={<LocalGasStationIcon sx={{ fontSize: 13 }} />} label={vehicle.fuel_type.toUpperCase()} size="small" variant="outlined" />
                          <Chip icon={<SpeedIcon sx={{ fontSize: 13 }} />} label={vehicle.transmission.toUpperCase()} size="small" variant="outlined" />
                          <Chip label={vehicle.ev_range_km ? `${vehicle.ev_range_km} km` : `${vehicle.mileage_kmpl || 18.5} km/l`} size="small" variant="outlined" />
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                          <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1 }}>EX-SHOWROOM</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: bc.border }}>
                              â‚¹{(vehicle.ex_showroom_price / 100000).toFixed(2)} Lakh
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button variant="outlined" size="small" onClick={() => setSelectedDetailVehicle(vehicle)}
                              sx={{ fontWeight: 600, borderColor: `${bc.border}50`, color: bc.border }}>
                              Specs
                            </Button>
                            <Button variant="contained" size="small" onClick={() => onStartPurchase(vehicle)}
                              sx={{ fontWeight: 700, background: `linear-gradient(135deg, ${bc.border}, ${bc.border}bb)`, color: '#000' }}>
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
        slotProps={{ paper: { sx: { borderRadius: '24px', bgcolor: 'background.paper', border: `1px solid ${bc.border}28`, p: 1 } } }}>
        {selectedDetailVehicle && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: bc.border, fontWeight: 700, textTransform: 'uppercase' }}>
                  {selectedDetailVehicle.brand?.name}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{selectedDetailVehicle.model_name}</Typography>
              </Box>
              <IconButton onClick={() => setSelectedDetailVehicle(null)}><CloseIcon /></IconButton>
            </DialogTitle>

            <DialogContent dividers>
              <Box component="img" src={selectedDetailVehicle.primary_image_url} alt={selectedDetailVehicle.model_name}
                onError={(e: any) => { e.target.onerror = null; e.target.src = '/images/cars/creta.png'; }}
                sx={{ width: '100%', height: 260, objectFit: 'cover', borderRadius: '16px', mb: 3 }} />

              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
                {selectedDetailVehicle.description || "India's benchmark vehicle in its segment offering cutting-edge convenience, advanced driver assistance systems, and exceptional safety engineering."}
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>Technical Specifications</Typography>
              <Table size="small" sx={{ mb: 3 }}>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Ex-Showroom Price</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: bc.border }}>â‚¹{(selectedDetailVehicle.ex_showroom_price / 100000).toFixed(2)} Lakh</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Approx. On-Road Price</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>â‚¹{((selectedDetailVehicle.on_road_price_approx || selectedDetailVehicle.ex_showroom_price * 1.15) / 100000).toFixed(2)} Lakh</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Fuel Type</TableCell>
                    <TableCell sx={{ textTransform: 'uppercase' }}>{selectedDetailVehicle.fuel_type}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Transmission</TableCell>
                    <TableCell sx={{ textTransform: 'uppercase' }}>{selectedDetailVehicle.transmission}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Safety Benchmark</TableCell>
                    <TableCell sx={{ color: '#00e676', fontWeight: 700 }}>{selectedDetailVehicle.safety_rating || 5}â˜… Crash Tested</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Seating Capacity</TableCell>
                    <TableCell>{selectedDetailVehicle.seating_capacity} Persons</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Horsepower & Torque</TableCell>
                    <TableCell>{selectedDetailVehicle.horsepower || 140} HP â€¢ {selectedDetailVehicle.torque_nm || 220} Nm</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Ground Clearance</TableCell>
                    <TableCell>{selectedDetailVehicle.ground_clearance_mm || 190} mm</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2 }}>
                <Button variant="outlined" startIcon={<CalculateIcon />}
                  onClick={() => { onNavigateToEMI(selectedDetailVehicle.ex_showroom_price); setSelectedDetailVehicle(null); }}
                  sx={{ color: bc.border, borderColor: bc.border }}>
                  Calculate EMI
                </Button>
                <Button variant="contained" size="large"
                  onClick={() => { const v = selectedDetailVehicle; setSelectedDetailVehicle(null); onStartPurchase(v); }}
                  sx={{ fontWeight: 700, px: 4, background: `linear-gradient(135deg, ${bc.border}, ${bc.border}bb)`, color: '#000' }}>
                  Start Purchase / Booking
                </Button>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Container>
  );
};

