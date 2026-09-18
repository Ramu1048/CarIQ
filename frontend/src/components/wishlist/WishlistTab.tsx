import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  IconButton,
  Chip,
  Paper,
  Tooltip,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import DeleteIcon from '@mui/icons-material/Delete';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

import { useWishlist } from '../../context/WishlistContext';
import { Vehicle } from '../../types';

interface WishlistTabProps {
  onNavigateToCatalog: () => void;
  onNavigateToCompare: () => void;
  onStartPurchase: (vehicle: Vehicle) => void;
}

export const WishlistTab: React.FC<WishlistTabProps> = ({
  onNavigateToCatalog,
  onNavigateToCompare,
  onStartPurchase,
}) => {
  const { wishlist, removeFromWishlist, toggleCompare, isInCompare } = useWishlist();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            My Wishlist ({wishlist.length})
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Vehicles you have saved for tracking price updates and comparative test drives
          </Typography>
        </Box>

        {wishlist.length > 1 && (
          <Button
            variant="contained"
            startIcon={<CompareArrowsIcon />}
            onClick={onNavigateToCompare}
            sx={{ fontWeight: 700 }}
          >
            Compare Saved Vehicles
          </Button>
        )}
      </Box>

      {wishlist.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <FavoriteIcon sx={{ fontSize: 56, color: '#94a3b8', mb: 2, opacity: 0.5 }} />
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
            Your Wishlist is Empty
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, maxWidth: 460, mx: 'auto' }}>
            Explore our vehicle showroom or consult the AI Advisor, and click the heart icon on any car to save it here.
          </Typography>
          <Button variant="contained" onClick={onNavigateToCatalog} sx={{ fontWeight: 700 }}>
            Explore Vehicle Showroom
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {wishlist.map((vehicle) => {
            const inCompare = isInCompare(vehicle.id);
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={vehicle.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 5 }}>
                    <Tooltip title="Remove from Wishlist">
                      <IconButton
                        size="small"
                        onClick={() => removeFromWishlist(vehicle.id)}
                        sx={{
                          bgcolor: 'rgba(239, 68, 68, 0.85)',
                          color: '#fff',
                          '&:hover': { bgcolor: '#ef4444' },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <CardMedia
                    component="img"
                    height="200"
                    image={vehicle.primary_image_url || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'}
                    alt={vehicle.model_name}
                  />

                  <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
                      {vehicle.brand?.name}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {vehicle.model_name}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, my: 1.5 }}>
                      <Chip label={vehicle.fuel_type.toUpperCase()} size="small" variant="outlined" />
                      <Chip label={vehicle.transmission.toUpperCase()} size="small" variant="outlined" />
                      <Chip label={`${vehicle.safety_rating || 5}★ Safety`} size="small" sx={{ bgcolor: 'rgba(0, 230, 118, 0.1)', color: '#00e676' }} />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1 }}>
                          EX-SHOWROOM
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#00e5ff' }}>
                          ₹{(vehicle.ex_showroom_price / 100000).toFixed(2)} Lakh
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => toggleCompare(vehicle)}
                          sx={{ borderColor: inCompare ? '#00e5ff' : 'rgba(255, 255, 255, 0.2)' }}
                        >
                          {inCompare ? 'Comparing' : 'Compare'}
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => onStartPurchase(vehicle as any)}
                          sx={{ fontWeight: 700 }}
                        >
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
    </Container>
  );
};
