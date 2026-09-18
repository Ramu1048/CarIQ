import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Button,
  Rating,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BuildIcon from '@mui/icons-material/Build';
import NavigationIcon from '@mui/icons-material/Navigation';

import { locationService } from '../../services/locationService';
import { ServiceCenter } from '../../types';

interface LocationsModalProps {
  open: boolean;
  onClose: () => void;
}

export const LocationsModal: React.FC<LocationsModalProps> = ({ open, onClose }) => {
  const [centers, setCenters] = useState<ServiceCenter[]>([]);
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    if (open) {
      locationService.getServiceCenters().then((data) => setCenters(data));
    }
  }, [open]);

  const filtered = centers.filter(
    (c) =>
      c.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.city.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.brand.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '24px',
            bgcolor: 'background.paper',
            border: '1px solid rgba(0, 229, 255, 0.25)',
            p: 1,
          },
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="caption" sx={{ color: '#00e5ff', fontWeight: 700, textTransform: 'uppercase' }}>
            DEALERSHIP & MAINTENANCE NETWORK
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Authorized Service Centers
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3 }}>
        {/* Search Input */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search by city or vehicle brand (e.g. Mumbai, Tata, Hyundai)..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#00e5ff' }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 3 }}
        />

        {/* Map Header Graphic / Illustration */}
        <Box
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: '16px',
            bgcolor: 'rgba(0, 229, 255, 0.06)',
            border: '1px solid rgba(0, 229, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <LocationOnIcon sx={{ color: '#00e5ff', fontSize: 28 }} />
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>
                GPS Telemetry Active
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Sorted by proximity to your current location (Worli, Mumbai)
              </Typography>
            </Box>
          </Box>
          <Chip label="Live Telemetry" color="success" size="small" />
        </Box>

        {/* Centers Grid */}
        <Grid container spacing={2.5}>
          {filtered.map((center) => (
            <Grid size={{ xs: 12, sm: 6 }} key={center.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 1 }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Chip label={center.brand} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                    <Chip
                      label={`${center.distance_km || 3.2} km away`}
                      size="small"
                      sx={{ bgcolor: 'rgba(0, 229, 255, 0.15)', color: '#00e5ff', fontWeight: 700 }}
                    />
                  </Box>

                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 1 }}>
                    {center.name}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 0.5 }}>
                    <Rating value={center.rating} precision={0.1} size="small" readOnly />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#ffb703' }}>
                      {center.rating} / 5.0
                    </Typography>
                  </Box>

                  <Typography variant="body2" sx={{ color: 'text.secondary', my: 1 }}>
                    {center.address}, {center.city}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <PhoneIcon sx={{ fontSize: 16, color: '#00e5ff' }} />
                    <Typography variant="caption">{center.phone}</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, mb: 1.5 }}>
                    <AccessTimeIcon sx={{ fontSize: 16, color: '#00e5ff' }} />
                    <Typography variant="caption">{center.opening_hours}</Typography>
                  </Box>

                  {/* Services tags */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {center.services.slice(0, 3).map((srv) => (
                      <Chip key={srv} label={srv} size="small" sx={{ fontSize: '0.65rem' }} />
                    ))}
                  </Box>

                  <Button
                    variant="contained"
                    size="small"
                    fullWidth
                    startIcon={<NavigationIcon />}
                    onClick={() => alert(`Launching navigation route to ${center.name}`)}
                    sx={{ fontWeight: 700 }}
                  >
                    Get Directions
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
    </Dialog>
  );
};
