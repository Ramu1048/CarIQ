import React, { useState, useEffect } from 'react';
import { Box, Snackbar, Alert } from '@mui/material';

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

        {currentTab === 7 && isAdmin && <AdminTab />}
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
            bgcolor: '#0f172a',
            color: '#00e5ff',
            border: '1px solid rgba(0, 229, 255, 0.4)',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 229, 255, 0.2)',
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
