import React, { useState, useEffect } from 'react';
import { Box, Snackbar, Alert, Button, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SecurityIcon from '@mui/icons-material/Security';

import { AuthProvider, useAuth } from './context/AuthContext';
import { WishlistProvider, useWishlist } from './context/WishlistContext';
import { ThemeProvider } from './context/ThemeContext';

import { WelcomeIntro } from './components/welcome/WelcomeIntro';
import { Navbar } from './components/layout/Navbar';
import { HomeTab } from './components/home/HomeTab';
import { CatalogTab } from './components/vehicles/CatalogTab';
import { AIAdvisorTab } from './components/ai/AIAdvisorTab';
import { CompareTab } from './components/compare/CompareTab';
import { FinanceTab } from './components/finance/FinanceTab';
import { WishlistTab } from './components/wishlist/WishlistTab';
import { PurchasesTab } from './components/purchases/PurchasesTab';
import { AdminTab } from './components/admin/AdminTab';
import { PurchaseFlowModal } from './components/purchases/PurchaseFlowModal';
import { LocationsModal } from './components/locations/LocationsModal';

import { vehicleService } from './services/vehicleService';
import { Vehicle } from './types';
import { MOCK_VEHICLES } from './services/mockData';

const MainApp: React.FC = () => {
  const { snackbarMessage, closeSnackbar } = useWishlist();
  const { isAdmin } = useAuth();

  // Welcome Intro Animation state
  const [showWelcome, setShowWelcome] = useState<boolean>(true);

  // Tab navigation state (0: Home, 1: Catalog, 2: AI, 3: Compare, 4: Finance, 5: Wishlist, 6: Purchases, 7: Admin)
  const [currentTab, setCurrentTab] = useState<number>(0);

  // Shared state
  const [vehicles, setVehicles] = useState<Vehicle[]>(MOCK_VEHICLES);
  const [activeSearchQuery, setActiveSearchQuery] = useState<string>('');
  const [activeFinancePrice, setActiveFinancePrice] = useState<number>(1699000);

  // Modals
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [selectedVehicleForPurchase, setSelectedVehicleForPurchase] = useState<Vehicle | null>(null);
  const [locationsModalOpen, setLocationsModalOpen] = useState(false);

  // Load vehicles from backend on mount
  useEffect(() => {
    vehicleService
      .getVehicles()
      .then((res) => {
        if (res.items?.length) {
          setVehicles(res.items as Vehicle[]);
        }
      })
      .catch(() => {});
  }, []);

  const handleStartPurchase = (vehicle: Vehicle) => {
    setSelectedVehicleForPurchase(vehicle);
    setPurchaseModalOpen(true);
  };

  const handleNavigateToCatalog = (searchQuery?: string) => {
    if (searchQuery) setActiveSearchQuery(searchQuery);
    setCurrentTab(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToAI = (initialQuery?: string) => {
    if (initialQuery) setActiveSearchQuery(initialQuery);
    setCurrentTab(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToEMI = (price: number) => {
    setActiveFinancePrice(price);
    setCurrentTab(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* 3D Automotive Welcome Intro Screen with Slide/Scroll-Up Transition */}
      {showWelcome && (
        <WelcomeIntro
          onComplete={() => {
            setShowWelcome(false);
            setCurrentTab(0); // Opens Home Tab after welcome animation
          }}
        />
      )}

      {/* Glassmorphism Header Bar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onReplayIntro={() => setShowWelcome(true)}
        onOpenLocations={() => setLocationsModalOpen(true)}
      />

      {/* Main Tab Views with Smooth Slide/Scroll Transitions */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          animation: 'fadeInSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          '@keyframes fadeInSlideUp': {
            '0%': { opacity: 0, transform: 'translateY(16px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        {currentTab === 0 && (
          <HomeTab
            vehicles={vehicles}
            onNavigateToCatalog={handleNavigateToCatalog}
            onNavigateToAI={handleNavigateToAI}
            onSelectVehicle={(v) => handleNavigateToCatalog(v.model_name)}
            onStartPurchase={handleStartPurchase}
          />
        )}

        {currentTab === 1 && (
          <CatalogTab
            vehicles={vehicles}
            onStartPurchase={handleStartPurchase}
            onNavigateToEMI={handleNavigateToEMI}
            initialSearchQuery={activeSearchQuery}
          />
        )}

        {currentTab === 2 && (
          <AIAdvisorTab
            initialQuery={activeSearchQuery}
            onSelectVehicle={(v) => handleNavigateToCatalog(v.model_name)}
            onStartPurchase={handleStartPurchase}
          />
        )}

        {currentTab === 3 && (
          <CompareTab
            vehicles={vehicles}
            onNavigateToCatalog={() => handleNavigateToCatalog()}
            onStartPurchase={handleStartPurchase}
          />
        )}

        {currentTab === 4 && <FinanceTab initialPrice={activeFinancePrice} />}

        {currentTab === 5 && (
          <WishlistTab
            onNavigateToCatalog={() => handleNavigateToCatalog()}
            onNavigateToCompare={() => setCurrentTab(3)}
            onStartPurchase={handleStartPurchase}
          />
        )}

        {currentTab === 6 && (
          <PurchasesTab
            vehicles={vehicles}
            onNavigateToCatalog={() => handleNavigateToCatalog()}
          />
        )}

        {currentTab === 7 && (
          isAdmin ? (
            <AdminTab />
          ) : (
            <Box sx={{ maxWidth: 540, mx: 'auto', py: 10, px: 2, textAlign: 'center' }}>
              <Box
                sx={{
                  p: { xs: 3, sm: 5 },
                  borderRadius: '24px',
                  bgcolor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)',
                }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '16px',
                    bgcolor: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2.5,
                  }}
                >
                  <LockOutlinedIcon sx={{ fontSize: 34 }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
                  Admin Authorization Required
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 3.5, lineHeight: 1.6 }}>
                  The CarIQ Admin Control Center is restricted to dealership operators, inventory managers, and system administrators.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => window.dispatchEvent(new CustomEvent('cariq_open_admin_auth'))}
                  startIcon={<SecurityIcon />}
                  sx={{
                    borderRadius: '12px',
                    fontWeight: 800,
                    px: 3.5,
                    py: 1.3,
                    background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
                    color: '#ffffff',
                    boxShadow: '0 4px 18px rgba(30, 58, 95, 0.25)',
                    '&:hover': { background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' },
                  }}
                >
                  Open Admin Login Portal
                </Button>
              </Box>
            </Box>
          )
        )}
      </Box>

      {/* Purchase Flow Multi-Step Modal */}
      <PurchaseFlowModal
        open={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        vehicle={selectedVehicleForPurchase}
        onPurchaseSuccess={() => {
          // After successful purchase, user can navigate to bookings
          setTimeout(() => {
            setCurrentTab(6);
          }, 600);
        }}
      />

      {/* Service Centers Location Modal */}
      <LocationsModal
        open={locationsModalOpen}
        onClose={() => setLocationsModalOpen(false)}
      />

      {/* Global Snackbar Alerts for Wishlist / Compare */}
      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={3500}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={closeSnackbar}
          severity="info"
          sx={{
            width: '100%',
            bgcolor: '#ffffff',
            color: '#1e3a5f',
            border: '1px solid #bfdbfe',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(30, 58, 95, 0.12)',
            fontWeight: 600,
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WishlistProvider>
          <MainApp />
        </WishlistProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
