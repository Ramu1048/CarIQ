import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Stepper,
  Step,
  StepLabel,
  Divider,
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ReceiptIcon from '@mui/icons-material/Receipt';
import VerifiedIcon from '@mui/icons-material/Verified';

import { Purchase, Vehicle } from '../../types';
import { purchaseService } from '../../services/purchaseService';

interface PurchasesTabProps {
  vehicles: Vehicle[];
  onNavigateToCatalog: () => void;
}

const TRACKING_STEPS = ['Order Booked', 'KYC & Finance Verified', 'Dispatched from Factory', 'PDI & Delivered'];

export const PurchasesTab: React.FC<PurchasesTabProps> = ({ vehicles, onNavigateToCatalog }) => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  useEffect(() => {
    purchaseService.getPurchases().then((list) => setPurchases(list));
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          My Vehicle Bookings & Orders
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Real-time tracking of manufacturing dispatch, financing status, and delivery milestones.
        </Typography>
      </Box>

      {purchases.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <DirectionsCarIcon sx={{ fontSize: 56, color: '#94a3b8', mb: 2, opacity: 0.5 }} />
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
            No Active Bookings Found
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, maxWidth: 460, mx: 'auto' }}>
            You haven't booked any vehicles yet. Explore our verified showroom to start your digital booking with a 100% refundable token deposit.
          </Typography>
          <Button variant="contained" onClick={onNavigateToCatalog} sx={{ fontWeight: 700 }}>
            Browse Vehicle Showroom
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {purchases.map((purchase) => {
            const vehicle = vehicles.find((v) => v.id === purchase.vehicle_id) || vehicles[0];

            return (
              <Paper
                key={purchase.id}
                sx={{
                  p: 3.5,
                  borderRadius: '20px',
                  border: '1px solid rgba(0, 229, 255, 0.25)',
                  bgcolor: 'background.paper',
                }}
              >
                {/* Header: Ref & Status */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      BOOKING REFERENCE NUMBER
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#00e5ff' }}>
                      {purchase.reference_number}
                    </Typography>
                  </Box>

                  <Chip
                    icon={<VerifiedIcon />}
                    label={purchase.status.toUpperCase()}
                    color="primary"
                    sx={{ fontWeight: 700, px: 1 }}
                  />
                </Box>

                {/* Vehicle Summary Details */}
                <Grid container spacing={3} sx={{ alignItems: 'center', mb: 4 }}>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Box
                      component="img"
                      src={vehicle?.primary_image_url}
                      alt={vehicle?.model_name}
                      sx={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: '12px' }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                      {vehicle?.brand?.name}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {vehicle?.model_name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                      Delivery Address: {purchase.customer_address || 'Worli, Mumbai, Maharashtra'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }} sx={{ textAlign: { sm: 'right' } }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      AGREED VEHICLE PRICE
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#00e5ff' }}>
                      ₹{(purchase.agreed_price / 100000).toFixed(2)} Lakh
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#00e676', fontWeight: 600, display: 'block' }}>
                      Token Deposit: ₹{(purchase.booking_amount || 25000).toLocaleString()} (Paid)
                    </Typography>
                  </Grid>
                </Grid>

                {/* Delivery Timeline Stepper */}
                <Box sx={{ mb: 3 }}>
                  <Stepper activeStep={1} alternativeLabel>
                    {TRACKING_STEPS.map((step) => (
                      <Step key={step}>
                        <StepLabel>{step}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Bottom Actions */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Booked on: {new Date(purchase.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Typography>

                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ReceiptIcon />}
                    onClick={() => alert(`Downloaded receipt for Booking ${purchase.reference_number}`)}
                    sx={{ color: '#00e5ff', borderColor: 'rgba(0, 229, 255, 0.4)' }}
                  >
                    Download Booking Receipt
                  </Button>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}
    </Container>
  );
};
