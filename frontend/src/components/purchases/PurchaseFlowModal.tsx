import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  RadioGroup,
  Radio,
  FormControlLabel,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Divider,
  Paper,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VerifiedIcon from '@mui/icons-material/Verified';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import confetti from 'canvas-confetti';

import { Vehicle, Purchase } from '../../types';
import { purchaseService } from '../../services/purchaseService';

interface PurchaseFlowModalProps {
  open: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  onPurchaseSuccess: (purchase: Purchase) => void;
}

const STEPS = ['Vehicle & Variant', 'Customer Details', 'Financing', 'KYC Documents', 'Token Payment'];

export const PurchaseFlowModal: React.FC<PurchaseFlowModalProps> = ({
  open,
  onClose,
  vehicle,
  onPurchaseSuccess,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form State
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [customerName, setCustomerName] = useState('Rahul Sharma');
  const [customerPhone, setCustomerPhone] = useState('+91 9876543210');
  const [deliveryAddress, setDeliveryAddress] = useState('1402, Lodha Bellissimo, Worli');
  const [deliveryPincode, setDeliveryPincode] = useState('400018');
  const [deliveryCity, setDeliveryCity] = useState('Mumbai');

  // Financing
  const [isFinanced, setIsFinanced] = useState(true);
  const [downPaymentAmount, setDownPaymentAmount] = useState(350000);
  const [tenure, setTenure] = useState(60);

  // Document Upload Status
  const [idProofUploaded, setIdProofUploaded] = useState(false);
  const [addressProofUploaded, setAddressProofUploaded] = useState(false);

  // Completed Purchase
  const [completedPurchase, setCompletedPurchase] = useState<Purchase | null>(null);

  if (!vehicle) return null;

  const currentPrice = vehicle.ex_showroom_price;
  const bookingDeposit = 25000;

  const handleNext = async () => {
    if (activeStep === STEPS.length - 1) {
      // Final Payment Submit
      setLoading(true);
      try {
        const purchase = await purchaseService.createPurchase({
          vehicle_id: vehicle.id,
          variant_id: selectedVariantId || undefined,
          agreed_price: currentPrice,
          booking_amount: bookingDeposit,
          is_financed: isFinanced,
          down_payment: isFinanced ? downPaymentAmount : undefined,
          loan_amount: isFinanced ? currentPrice - downPaymentAmount : undefined,
          loan_tenure_months: isFinanced ? tenure : undefined,
          customer_address: `${deliveryAddress}, ${deliveryCity} - ${deliveryPincode}`,
          delivery_pincode: deliveryPincode,
        });

        setCompletedPurchase(purchase);
        setActiveStep(STEPS.length);

        // Confetti celebration
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}

        onPurchaseSuccess(purchase);
      } catch {
        alert('Booking processing error. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(0, prev - 1));
  };

  const handleSimulateDocUpload = (type: 'id' | 'address') => {
    if (type === 'id') setIdProofUploaded(true);
    if (type === 'address') setAddressProofUploaded(true);
  };

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
            CARiq DIGITAL CONCIERGE
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {activeStep >= STEPS.length ? '🎉 Booking Confirmed!' : `Book Your ${vehicle.model_name}`}
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3 }}>
        {activeStep < STEPS.length ? (
          <>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
              {STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Step 0: Vehicle & Variant Review */}
            {activeStep === 0 && (
              <Box>
                <Grid container spacing={3} sx={{ alignItems: 'center' }}>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <Box
                      component="img"
                      src={vehicle.primary_image_url}
                      alt={vehicle.model_name}
                      sx={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: '16px' }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 7 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 700 }}>
                      {vehicle.brand?.name}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      {vehicle.model_name}
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#00e5ff', fontWeight: 800, my: 1 }}>
                      ₹{(currentPrice / 100000).toFixed(2)} Lakh
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {vehicle.fuel_type.toUpperCase()} • {vehicle.transmission.toUpperCase()} • {vehicle.safety_rating || 5}★ Safety
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Select Preferred Model Trim
                </Typography>
                <RadioGroup value={selectedVariantId} onChange={(e) => setSelectedVariantId(e.target.value)}>
                  {vehicle.variants?.map((varItem) => (
                    <Paper
                      key={varItem.id}
                      sx={{
                        p: 2,
                        mb: 1.5,
                        borderRadius: '12px',
                        border: selectedVariantId === varItem.id ? '2px solid #00e5ff' : '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      <FormControlLabel
                        value={varItem.id}
                        control={<Radio sx={{ color: '#00e5ff', '&.Mui-checked': { color: '#00e5ff' } }} />}
                        label={
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 700 }}>
                              {varItem.name} {varItem.is_top_variant && '★ Flagship'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              Ex-Showroom: ₹{(varItem.ex_showroom_price / 100000).toFixed(2)} Lakh • Key features: {varItem.key_features.join(', ')}
                            </Typography>
                          </Box>
                        }
                      />
                    </Paper>
                  ))}
                </RadioGroup>
              </Box>
            )}

            {/* Step 1: Customer KYC & Address Details */}
            {activeStep === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Delivery & Contact Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Full Legal Name"
                      fullWidth
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Phone Number"
                      fullWidth
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Delivery Street Address"
                      fullWidth
                      multiline
                      rows={2}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="City"
                      fullWidth
                      value={deliveryCity}
                      onChange={(e) => setDeliveryCity(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Pincode"
                      fullWidth
                      value={deliveryPincode}
                      onChange={(e) => setDeliveryPincode(e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Step 2: Financing Configuration */}
            {activeStep === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Select Payment Preference
                </Typography>
                <RadioGroup
                  row
                  value={isFinanced ? 'loan' : 'cash'}
                  onChange={(e) => setIsFinanced(e.target.value === 'loan')}
                >
                  <FormControlLabel value="loan" control={<Radio sx={{ color: '#00e5ff' }} />} label="Finance via Auto Loan" />
                  <FormControlLabel value="cash" control={<Radio sx={{ color: '#00e5ff' }} />} label="Full Cash Payment" />
                </RadioGroup>

                {isFinanced && (
                  <Paper sx={{ p: 3, borderRadius: '16px', bgcolor: 'rgba(0, 229, 255, 0.05)', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                      Customized Loan Summary
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Down Payment Amount
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          ₹{downPaymentAmount.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Estimated Monthly EMI
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#00e5ff', fontWeight: 800 }}>
                          ₹{Math.round((currentPrice - downPaymentAmount) * 0.021).toLocaleString()}/mo
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                )}
              </Box>
            )}

            {/* Step 3: Document Upload */}
            {activeStep === 3 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Upload Verification Documents
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Secure encrypted upload for RTO vehicle registration and insurance verification.
                </Typography>

                <Paper sx={{ p: 2.5, borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      1. Government Identity Proof (PAN / Aadhaar)
                    </Typography>
                    <Typography variant="caption" sx={{ color: idProofUploaded ? '#00e676' : 'text.secondary' }}>
                      {idProofUploaded ? '✓ Document uploaded and verified' : 'Accepted: PDF, JPEG, PNG (Max 10MB)'}
                    </Typography>
                  </Box>
                  <Button
                    variant={idProofUploaded ? 'outlined' : 'contained'}
                    size="small"
                    startIcon={idProofUploaded ? <CheckCircleIcon /> : <CloudUploadIcon />}
                    color={idProofUploaded ? 'success' : 'primary'}
                    onClick={() => handleSimulateDocUpload('id')}
                  >
                    {idProofUploaded ? 'Re-upload' : 'Upload ID'}
                  </Button>
                </Paper>

                <Paper sx={{ p: 2.5, borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      2. Address Proof / Driving License
                    </Typography>
                    <Typography variant="caption" sx={{ color: addressProofUploaded ? '#00e676' : 'text.secondary' }}>
                      {addressProofUploaded ? '✓ Document uploaded and verified' : 'Accepted: PDF, JPEG, PNG (Max 10MB)'}
                    </Typography>
                  </Box>
                  <Button
                    variant={addressProofUploaded ? 'outlined' : 'contained'}
                    size="small"
                    startIcon={addressProofUploaded ? <CheckCircleIcon /> : <CloudUploadIcon />}
                    color={addressProofUploaded ? 'success' : 'primary'}
                    onClick={() => handleSimulateDocUpload('address')}
                  >
                    {addressProofUploaded ? 'Re-upload' : 'Upload Proof'}
                  </Button>
                </Paper>
              </Box>
            )}

            {/* Step 4: Token Payment Checkout */}
            {activeStep === 4 && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    bgcolor: 'rgba(0, 229, 255, 0.15)',
                    color: '#00e5ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <PaymentIcon sx={{ fontSize: 32 }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  Booking Deposit Amount
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#00e5ff', my: 1.5 }}>
                  ₹{bookingDeposit.toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 500, mx: 'auto', mb: 3 }}>
                  100% refundable token booking deposit to reserve your vehicle allotment directly from the manufacturer factory pool.
                </Typography>

                <Alert severity="info" sx={{ maxWidth: 520, mx: 'auto', textAlign: 'left', mb: 2 }}>
                  Simulated Razorpay / Stripe sandbox checkout active. No real card will be charged.
                </Alert>
              </Box>
            )}

            {/* Bottom Stepper Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button disabled={activeStep === 0 || loading} onClick={handleBack}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading}
                sx={{ px: 4, fontWeight: 700 }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: '#000' }} /> : activeStep === STEPS.length - 1 ? 'Pay ₹25,000 & Confirm Booking' : 'Continue'}
              </Button>
            </Box>
          </>
        ) : (
          /* Confirmation Screen */
          completedPurchase && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircleIcon sx={{ fontSize: 72, color: '#00e676', mb: 2 }} />
              <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
                Booking Reference: {completedPurchase.reference_number}
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
                Congratulations, {customerName}! Your booking for the <b>{vehicle.brand?.name} {vehicle.model_name}</b> has been locked with priority dealership dispatch.
              </Typography>

              <Paper sx={{ p: 3, maxWidth: 500, mx: 'auto', mb: 4, textAlign: 'left', borderRadius: '16px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Vehicle</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{vehicle.model_name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Agreed Price</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{(completedPurchase.agreed_price / 100000).toFixed(2)} Lakh</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Token Paid</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#00e676' }}>₹25,000 (Verified)</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Estimated Delivery ETA</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#00e5ff' }}>14 - 18 Days</Typography>
                </Box>
              </Paper>

              <Button variant="contained" size="large" onClick={onClose} sx={{ px: 5, fontWeight: 700 }}>
                View In My Bookings
              </Button>
            </Box>
          )
        )}
      </DialogContent>
    </Dialog>
  );
};
