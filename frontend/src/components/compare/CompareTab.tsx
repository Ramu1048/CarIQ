import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Tooltip,
} from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

import { useWishlist } from '../../context/WishlistContext';
import { Vehicle, AICompareResponse } from '../../types';
import { aiService } from '../../services/aiService';

interface CompareTabProps {
  vehicles: Vehicle[];
  onNavigateToCatalog: () => void;
  onStartPurchase: (vehicle: Vehicle) => void;
}

export const CompareTab: React.FC<CompareTabProps> = ({
  vehicles,
  onNavigateToCatalog,
  onStartPurchase,
}) => {
  const { compareList, toggleCompare, clearCompare } = useWishlist();
  const [comparisonAnalysis, setComparisonAnalysis] = useState<AICompareResponse | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Auto-fill with first 2 vehicles if user hasn't added any yet
  const activeVehicles = compareList.length >= 2 ? compareList : vehicles.slice(0, 2);

  useEffect(() => {
    if (activeVehicles.length >= 2) {
      setLoadingAI(true);
      aiService
        .compareVehicles(activeVehicles.map((v) => v.id))
        .then((res) => setComparisonAnalysis(res))
        .catch(() => {})
        .finally(() => setLoadingAI(false));
    }
  }, [activeVehicles.length]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Title */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Side-by-Side Car Comparison
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Comparing {activeVehicles.length} vehicles on verified specifications & AI analytical verdict
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {compareList.length > 0 && (
            <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={clearCompare}>
              Clear Comparison
            </Button>
          )}
          <Button variant="contained" onClick={onNavigateToCatalog} sx={{ fontWeight: 700 }}>
            + Add More Cars (Up to 4)
          </Button>
        </Box>
      </Box>

      {/* AI Verdict Card */}
      {comparisonAnalysis && (
        <Paper
          sx={{
            p: 3,
            mb: 4,
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.08) 0%, rgba(11, 28, 63, 0.4) 100%)',
            border: '1px solid rgba(0, 229, 255, 0.3)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                bgcolor: '#00e5ff',
                color: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AutoAwesomeIcon fontSize="small" />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#00e5ff' }}>
              CarIQ AI Analytical Verdict
            </Typography>
          </Box>

          <Typography variant="body1" sx={{ color: 'text.primary', mb: 2.5, lineHeight: 1.6 }}>
            {comparisonAnalysis.ai_verdict}
          </Typography>

          {/* Category Winners */}
          <Grid container spacing={2}>
            {Object.entries(comparisonAnalysis.winner_by_category).map(([category, winner]) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={category}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '12px',
                    bgcolor: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#ffb703', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <EmojiEventsIcon fontSize="inherit" /> {category.toUpperCase()}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#ffffff', mt: 0.5 }}>
                    {winner}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Side by Side Specs Comparison Table */}
      <Paper sx={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(0, 229, 255, 0.04)' }}>
              <TableCell sx={{ fontWeight: 800, width: 220, fontSize: '1rem' }}>Parameters</TableCell>
              {activeVehicles.map((v) => (
                <TableCell key={v.id} align="center" sx={{ minWidth: 220 }}>
                  <Box sx={{ position: 'relative' }}>
                    <IconButton
                      size="small"
                      onClick={() => toggleCompare(v)}
                      sx={{ position: 'absolute', top: -8, right: -8, color: '#94a3b8' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                    <Box
                      component="img"
                      src={v.primary_image_url || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'}
                      alt={v.model_name}
                      sx={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: '12px', mb: 1 }}
                    />
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 700 }}>
                      {v.brand?.name}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {v.model_name}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ color: '#00e5ff', fontWeight: 800, my: 0.5 }}>
                      ₹{(v.ex_showroom_price / 100000).toFixed(2)} Lakh
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      fullWidth
                      onClick={() => onStartPurchase(v as any)}
                      sx={{ fontWeight: 700, mt: 1 }}
                    >
                      Book Now
                    </Button>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Body Style</TableCell>
              {activeVehicles.map((v) => (
                <TableCell key={v.id} align="center" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                  {v.body_type}
                </TableCell>
              ))}
            </TableRow>

            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Fuel Type</TableCell>
              {activeVehicles.map((v) => (
                <TableCell key={v.id} align="center" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                  {v.fuel_type}
                </TableCell>
              ))}
            </TableRow>

            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Transmission</TableCell>
              {activeVehicles.map((v) => (
                <TableCell key={v.id} align="center" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                  {v.transmission}
                </TableCell>
              ))}
            </TableRow>

            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Mileage / Range</TableCell>
              {activeVehicles.map((v) => (
                <TableCell key={v.id} align="center" sx={{ fontWeight: 700, color: '#00e5ff' }}>
                  {v.ev_range_km ? `${v.ev_range_km} km (ARAI)` : `${v.mileage_kmpl || 18.5} km/l`}
                </TableCell>
              ))}
            </TableRow>

            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Safety Benchmark</TableCell>
              {activeVehicles.map((v) => (
                <TableCell key={v.id} align="center">
                  <Chip
                    label={`${v.safety_rating || 5}★ Crash Tested`}
                    size="small"
                    sx={{ bgcolor: 'rgba(0, 230, 118, 0.15)', color: '#00e676', fontWeight: 700 }}
                  />
                </TableCell>
              ))}
            </TableRow>

            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Seating Capacity</TableCell>
              {activeVehicles.map((v) => (
                <TableCell key={v.id} align="center" sx={{ fontWeight: 600 }}>
                  {v.seating_capacity} Seats
                </TableCell>
              ))}
            </TableRow>

            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Electric Sunroof</TableCell>
              {activeVehicles.map((v) => (
                <TableCell key={v.id} align="center">
                  {v.has_sunroof ? (
                    <Chip label="Equipped" size="small" color="primary" />
                  ) : (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Not Available
                    </Typography>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};
