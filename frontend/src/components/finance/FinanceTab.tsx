import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Slider,
  TextField,
  InputAdornment,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Card,
  CardContent,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PercentIcon from '@mui/icons-material/Percent';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

import { financeService } from '../../services/financeService';
import { EMICalculationResponse, AffordabilityResponse } from '../../types';

interface FinanceTabProps {
  initialPrice?: number;
}

export const FinanceTab: React.FC<FinanceTabProps> = ({ initialPrice = 1600000 }) => {
  const [activeSubTab, setActiveSubTab] = useState(0);

  // EMI Calculator Inputs
  const [vehiclePrice, setVehiclePrice] = useState(initialPrice);
  const [downPayment, setDownPayment] = useState(initialPrice * 0.2);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenureMonths, setTenureMonths] = useState(60);
  const [emiData, setEmiData] = useState<EMICalculationResponse | null>(null);

  // Affordability Inputs
  const [monthlyIncomeBudget, setMonthlyIncomeBudget] = useState(40000);
  const [affordabilityData, setAffordabilityData] = useState<AffordabilityResponse | null>(null);

  useEffect(() => {
    financeService
      .calculateEMI({
        vehicle_price: vehiclePrice,
        down_payment: downPayment,
        interest_rate: interestRate,
        tenure_months: tenureMonths,
      })
      .then((res) => setEmiData(res));
  }, [vehiclePrice, downPayment, interestRate, tenureMonths]);

  useEffect(() => {
    financeService.calculateAffordability(monthlyIncomeBudget).then((res) => setAffordabilityData(res));
  }, [monthlyIncomeBudget]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Title */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Chip
          icon={<CalculateIcon sx={{ color: '#00e5ff !important' }} />}
          label="INTELLIGENT LOAN & EMI COMPUTATION"
          sx={{
            bgcolor: 'rgba(0, 229, 255, 0.1)',
            color: '#00e5ff',
            fontWeight: 700,
            border: '1px solid rgba(0, 229, 255, 0.3)',
            mb: 1.5,
          }}
        />
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          CarIQ Finance Studio
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Calculate exact monthly outflows, compare tenure impacts, and inspect full loan amortization.
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Tabs
            value={activeSubTab}
            onChange={(_, val) => setActiveSubTab(val)}
            sx={{
              bgcolor: 'background.paper',
              borderRadius: '50px',
              p: 0.5,
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Tab label="EMI & Loan Calculator" sx={{ borderRadius: '50px', fontWeight: 700 }} />
            <Tab label="Affordability Estimator" sx={{ borderRadius: '50px', fontWeight: 700 }} />
          </Tabs>
        </Box>
      </Box>

      {activeSubTab === 0 ? (
        <Grid container spacing={4}>
          {/* Sliders Input Column */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 4, borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Configure Loan Parameters
              </Typography>

              {/* Vehicle Price */}
              <Box sx={{ mb: 3.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Vehicle On-Road / Ex-Showroom Price
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#00e5ff' }}>
                    ₹{(vehiclePrice / 100000).toFixed(2)} Lakh
                  </Typography>
                </Box>
                <Slider
                  value={vehiclePrice}
                  onChange={(_, val) => {
                    const price = val as number;
                    setVehiclePrice(price);
                    if (downPayment > price) setDownPayment(price * 0.2);
                  }}
                  min={500000}
                  max={4500000}
                  step={50000}
                  sx={{ color: '#00e5ff' }}
                />
              </Box>

              {/* Down Payment */}
              <Box sx={{ mb: 3.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Upfront Down Payment ({Math.round((downPayment / vehiclePrice) * 100)}%)
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#ffb703' }}>
                    ₹{(downPayment / 100000).toFixed(2)} Lakh
                  </Typography>
                </Box>
                <Slider
                  value={downPayment}
                  onChange={(_, val) => setDownPayment(val as number)}
                  min={100000}
                  max={vehiclePrice * 0.8}
                  step={25000}
                  sx={{ color: '#ffb703' }}
                />
              </Box>

              {/* Interest Rate */}
              <Box sx={{ mb: 3.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Annual Interest Rate (%)
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#00e676' }}>
                    {interestRate}% p.a.
                  </Typography>
                </Box>
                <Slider
                  value={interestRate}
                  onChange={(_, val) => setInterestRate(val as number)}
                  min={6.5}
                  max={14.0}
                  step={0.1}
                  sx={{ color: '#00e676' }}
                />
              </Box>

              {/* Tenure in Months */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Loan Tenure ({tenureMonths / 12} Years)
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>
                    {tenureMonths} Months
                  </Typography>
                </Box>
                <Slider
                  value={tenureMonths}
                  onChange={(_, val) => setTenureMonths(val as number)}
                  min={12}
                  max={84}
                  step={12}
                  marks={[
                    { value: 12, label: '1Y' },
                    { value: 36, label: '3Y' },
                    { value: 60, label: '5Y' },
                    { value: 84, label: '7Y' },
                  ]}
                  sx={{ color: '#00e5ff' }}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Results Summary Column */}
          <Grid size={{ xs: 12, md: 6 }}>
            {emiData && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {/* Highlight Monthly EMI Card */}
                <Card
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.15) 0%, rgba(15, 23, 42, 0.8) 100%)',
                    border: '1px solid rgba(0, 229, 255, 0.4)',
                    boxShadow: '0 20px 40px rgba(0, 229, 255, 0.15)',
                  }}
                >
                  <Typography variant="subtitle1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    ESTIMATED MONTHLY INSTALLMENT (EMI)
                  </Typography>
                  <Typography variant="h2" sx={{ fontWeight: 900, color: '#00e5ff', my: 1 }}>
                    ₹{emiData.monthly_emi.toLocaleString()}
                    <Typography component="span" variant="h5" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                      /month
                    </Typography>
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Principal Loan Amount: ₹{emiData.loan_amount.toLocaleString()}
                  </Typography>
                </Card>

                {/* Detailed Breakdown Metrics */}
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Paper sx={{ p: 2.5, borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        TOTAL INTEREST PAYABLE
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffb703', mt: 0.5 }}>
                        ₹{emiData.total_interest.toLocaleString()}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 6 }}>
                    <Paper sx={{ p: 2.5, borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        TOTAL PAYMENT (LOAN + INT)
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff', mt: 0.5 }}>
                        ₹{emiData.total_payment.toLocaleString()}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Amortization Schedule Preview */}
                <Paper sx={{ p: 3, borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                    Yearly Amortization Schedule
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Year</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Principal</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Interest</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Ending Balance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[1, 2, 3, 4, 5]
                        .filter((yr) => yr <= tenureMonths / 12)
                        .map((yr) => {
                          const yearItems = emiData.amortization_schedule.filter((it) => it.year === yr);
                          const princ = yearItems.reduce((acc, it) => acc + it.principal, 0);
                          const int = yearItems.reduce((acc, it) => acc + it.interest, 0);
                          const last = yearItems[yearItems.length - 1];

                          return (
                            <TableRow key={yr}>
                              <TableCell sx={{ fontWeight: 600 }}>Year {yr}</TableCell>
                              <TableCell>₹{princ.toLocaleString()}</TableCell>
                              <TableCell sx={{ color: '#ffb703' }}>₹{int.toLocaleString()}</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>
                                ₹{last ? last.ending_balance.toLocaleString() : 0}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </Paper>
              </Box>
            )}
          </Grid>
        </Grid>
      ) : (
        /* Affordability Calculator View */
        <Box sx={{ maxWidth: 720, mx: 'auto' }}>
          <Paper sx={{ p: 4, borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
              What Car Can I Afford?
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
              Enter your comfortable monthly car budget and we will reverse-engineer your maximum vehicle price.
            </Typography>

            <Box sx={{ mb: 4 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                My Monthly Budget for Car EMI:
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 900, color: '#00e5ff', mb: 2 }}>
                ₹{monthlyIncomeBudget.toLocaleString()}
              </Typography>
              <Slider
                value={monthlyIncomeBudget}
                onChange={(_, val) => setMonthlyIncomeBudget(val as number)}
                min={15000}
                max={150000}
                step={2500}
                sx={{ color: '#00e5ff' }}
              />
            </Box>

            {affordabilityData && (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Card sx={{ p: 2.5, bgcolor: 'rgba(0, 229, 255, 0.08)', border: '1px solid rgba(0, 229, 255, 0.3)' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      MAX AFFORDABLE LOAN
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#00e5ff', mt: 0.5 }}>
                      ₹{(affordabilityData.max_loan_amount / 100000).toFixed(2)} Lakh
                    </Typography>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Card sx={{ p: 2.5, bgcolor: 'rgba(0, 230, 118, 0.08)', border: '1px solid rgba(0, 230, 118, 0.3)' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      RECOMMENDED VEHICLE PRICE
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#00e676', mt: 0.5 }}>
                      ₹{(affordabilityData.recommended_vehicle_price_range.min / 100000).toFixed(1)}L - ₹
                      {(affordabilityData.recommended_vehicle_price_range.max / 100000).toFixed(1)}L
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Paper>
        </Box>
      )}
    </Container>
  );
};
