import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';

import { adminService } from '../../services/adminService';
import { AdminDashboardData, Purchase } from '../../types';

export const AdminTab: React.FC = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);

  useEffect(() => {
    adminService.getDashboard().then((res) => setData(res));
  }, []);

  const handleStatusChange = async (purchaseId: string, newStatus: string) => {
    await adminService.updatePurchaseStatus(purchaseId, newStatus);
    // update local state
    if (data) {
      const updatedList = data.recent_purchases.map((p) =>
        p.id === purchaseId ? { ...p, status: newStatus as any } : p
      );
      setData({ ...data, recent_purchases: updatedList });
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          CarIQ Admin Control Center
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Role-protected management dashboard for real-time customer bookings, catalog controls, and metrics.
        </Typography>
      </Box>

      {/* KPI Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  TOTAL PLATFORM USERS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {data?.total_users.toLocaleString() || '1,420'}
                </Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: 'rgba(0, 229, 255, 0.1)', color: '#00e5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PeopleIcon />
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  CATALOG VEHICLES
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {data?.total_vehicles || 32}
                </Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: 'rgba(0, 230, 118, 0.1)', color: '#00e676', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DirectionsCarIcon />
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  TOTAL BOOKINGS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {data?.total_purchases || 89}
                </Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: 'rgba(255, 183, 3, 0.1)', color: '#ffb703', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBagIcon />
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  GROSS MERCHANDISE VALUE
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: '#00e5ff' }}>
                  ₹16.4 Cr
                </Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: 'rgba(0, 229, 255, 0.1)', color: '#00e5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CurrencyRupeeIcon />
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Bookings Status Management Table */}
      <Paper sx={{ p: 3, borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Recent Customer Bookings
        </Typography>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Booking Ref</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Token Paid</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Financing</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.recent_purchases?.length ? data.recent_purchases : [
              {
                id: 'ord-mock-1',
                reference_number: 'CIQ-2026-948201',
                agreed_price: 1699000,
                booking_amount: 25000,
                is_financed: true,
                status: 'booked',
              },
              {
                id: 'ord-mock-2',
                reference_number: 'CIQ-2026-382910',
                agreed_price: 2199000,
                booking_amount: 25000,
                is_financed: false,
                status: 'processing',
              },
            ]).map((item: any) => (
              <TableRow key={item.id}>
                <TableCell sx={{ fontWeight: 700, color: '#00e5ff' }}>{item.reference_number}</TableCell>
                <TableCell>₹{(item.agreed_price / 100000).toFixed(2)} Lakh</TableCell>
                <TableCell sx={{ color: '#00e676', fontWeight: 600 }}>₹{(item.booking_amount || 25000).toLocaleString()}</TableCell>
                <TableCell>{item.is_financed ? 'Loan Financed' : 'Full Cash'}</TableCell>
                <TableCell>
                  <Chip
                    label={item.status.toUpperCase()}
                    size="small"
                    color={item.status === 'completed' ? 'success' : 'primary'}
                  />
                </TableCell>
                <TableCell>
                  <Select
                    size="small"
                    value={item.status}
                    onChange={(e) => handleStatusChange(item.id, e.target.value)}
                    sx={{ minWidth: 140, fontSize: '0.8rem' }}
                  >
                    <MenuItem value="booked">Booked</MenuItem>
                    <MenuItem value="processing">Processing</MenuItem>
                    <MenuItem value="completed">Delivered</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};
