import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartApi } from '../api';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({
    items: [],
    subtotalInr: 0,
    gstTotalInr: 0,
    estimatedTotalInr: 0,
    itemCount: 0,
    valid: true,
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartApi.getCart();
      if (response.data && response.data.success) {
        setCart(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err);
      setError('Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (variantId, quantity = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartApi.addItem(variantId, quantity);
      if (response.data && response.data.success) {
        setCart(response.data.data);
        setIsDrawerOpen(true); // Open drawer upon adding item
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to add item to cart';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (variantId, quantity) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartApi.updateItemQuantity(variantId, quantity);
      if (response.data && response.data.success) {
        setCart(response.data.data);
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to update quantity';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (variantId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartApi.removeItem(variantId);
      if (response.data && response.data.success) {
        setCart(response.data.data);
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to remove item';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartApi.clearCart();
      if (response.data && response.data.success) {
        setCart(response.data.data);
        return { success: true };
      }
    } catch (err) {
      setError('Failed to clear cart');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const mergeGuestCart = async () => {
    try {
      const response = await cartApi.mergeGuestCart();
      if (response.data && response.data.success) {
        setCart(response.data.data);
      }
    } catch (err) {
      console.error('Failed to merge guest cart:', err);
    }
  };

  const validateCart = async () => {
    try {
      const response = await cartApi.validateCart();
      if (response.data && response.data.success) {
        return response.data.data;
      }
    } catch (err) {
      return { valid: false, errors: ['Failed to validate cart'] };
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isDrawerOpen,
        setIsDrawerOpen,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
        loading,
        error,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        mergeGuestCart,
        validateCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
