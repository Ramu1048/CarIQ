import React, { createContext, useContext, useState, useEffect } from 'react';
import { VehicleSummary } from '../types';

interface WishlistContextType {
  wishlist: VehicleSummary[];
  compareList: VehicleSummary[];
  addToWishlist: (vehicle: VehicleSummary) => void;
  removeFromWishlist: (vehicleId: string) => void;
  isInWishlist: (vehicleId: string) => boolean;
  toggleCompare: (vehicle: VehicleSummary) => void;
  isInCompare: (vehicleId: string) => boolean;
  clearCompare: () => void;
  snackbarMessage: string | null;
  closeSnackbar: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<VehicleSummary[]>(() => {
    const saved = localStorage.getItem('cariq_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [compareList, setCompareList] = useState<VehicleSummary[]>(() => {
    const saved = localStorage.getItem('cariq_compare');
    return saved ? JSON.parse(saved) : [];
  });

  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('cariq_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('cariq_compare', JSON.stringify(compareList));
  }, [compareList]);

  const addToWishlist = (vehicle: VehicleSummary) => {
    if (!wishlist.some((v) => v.id === vehicle.id)) {
      setWishlist((prev) => [...prev, vehicle]);
      setSnackbarMessage(`Added ${vehicle.brand.name} ${vehicle.model_name} to wishlist ❤️`);
    }
  };

  const removeFromWishlist = (vehicleId: string) => {
    const found = wishlist.find((v) => v.id === vehicleId);
    setWishlist((prev) => prev.filter((v) => v.id !== vehicleId));
    if (found) {
      setSnackbarMessage(`Removed ${found.brand.name} ${found.model_name} from wishlist`);
    }
  };

  const isInWishlist = (vehicleId: string) => wishlist.some((v) => v.id === vehicleId);

  const toggleCompare = (vehicle: VehicleSummary) => {
    if (compareList.some((v) => v.id === vehicle.id)) {
      setCompareList((prev) => prev.filter((v) => v.id !== vehicle.id));
      setSnackbarMessage(`Removed ${vehicle.model_name} from comparison`);
    } else {
      if (compareList.length >= 4) {
        setSnackbarMessage('You can compare a maximum of 4 vehicles at a time');
        return;
      }
      setCompareList((prev) => [...prev, vehicle]);
      setSnackbarMessage(`Added ${vehicle.model_name} to comparison (${compareList.length + 1}/4)`);
    }
  };

  const isInCompare = (vehicleId: string) => compareList.some((v) => v.id === vehicleId);

  const clearCompare = () => {
    setCompareList([]);
    setSnackbarMessage('Comparison list cleared');
  };

  const closeSnackbar = () => setSnackbarMessage(null);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        compareList,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleCompare,
        isInCompare,
        clearCompare,
        snackbarMessage,
        closeSnackbar,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
};
