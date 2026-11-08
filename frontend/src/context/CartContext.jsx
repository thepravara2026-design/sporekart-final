import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  const [addedProductPopup, setAddedProductPopup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inFlightUpdates = useRef(new Map());

  const recalculateOptimisticTotals = (items, currentCart) => {
    let subtotal = 0;
    let sumQty = 0;

    (items || []).forEach((item) => {
      const qty = item.quantity || 0;
      const price = Number(item.unitPriceInr) || 0;
      sumQty += qty;
      subtotal += price * qty;
    });

    const freeDeliveryThreshold = 999;
    const shippingFee = (subtotal >= freeDeliveryThreshold || (items || []).length === 0) ? 0 : (currentCart?.shippingFeeInr || 0);
    const promoDiscount = currentCart?.promoDiscountInr || 0;
    const gstTotal = (items || []).reduce((sum, item) => {
      const itemGst = item.gstAmountInr !== undefined 
        ? Number(item.gstAmountInr) * (item.quantity || 0) 
        : (Number(item.unitPriceInr || 0) * (item.quantity || 0) * 0.05);
      return sum + itemGst;
    }, 0);
    const estimatedTotal = Math.max(0, subtotal - promoDiscount + shippingFee);

    return {
      ...currentCart,
      items,
      itemCount: sumQty,
      totalQuantity: sumQty,
      subtotalInr: Number(subtotal.toFixed(2)),
      gstTotalInr: Number(gstTotal.toFixed(2)),
      estimatedTotalInr: Number(estimatedTotal.toFixed(2)),
    };
  };

  const normalizeCartData = (cartData) => {
    if (!cartData) {
      return { items: [], subtotalInr: 0, gstTotalInr: 0, estimatedTotalInr: 0, itemCount: 0, totalQuantity: 0, valid: true };
    }
    const items = cartData.items || [];
    const sumQty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    return {
      ...cartData,
      items,
      itemCount: sumQty,
      totalQuantity: sumQty,
    };
  };

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartApi.getCart();
      if (response.data && response.data.success) {
        setCart(normalizeCartData(response.data.data));
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

  const addToCart = async (variantId, quantity = 1, availableStock = null) => {
    try {
      setLoading(true);
      setError(null);

      // Check client-side cart stock limits if availableStock is known or present in cart
      const existing = cart.items?.find((i) => i.variantId === variantId);
      const currentInCart = existing ? existing.quantity : 0;
      const stockLimit = availableStock !== null && availableStock !== undefined 
        ? availableStock 
        : (existing?.availableStock !== undefined ? existing.availableStock : null);

      if (stockLimit !== null && stockLimit !== undefined && (currentInCart + quantity) > stockLimit) {
        const msg = stockLimit <= 0 
          ? 'Item is out of stock' 
          : currentInCart > 0 
            ? `Only ${stockLimit} items available (${currentInCart} already in cart)` 
            : `Cannot add more than available stock (${stockLimit})`;
        setError(msg);
        return { success: false, message: msg };
      }

      const response = await cartApi.addItem(variantId, quantity);
      if (response.data && response.data.success) {
        const normalized = normalizeCartData(response.data.data);
        setCart(normalized);
        
        // Find added item from updated cart
        const addedItem = normalized.items?.find((i) => i.variantId === variantId) || {
          variantId,
          quantity: currentInCart + quantity,
          availableStock: stockLimit,
        };

        // Trigger Popup Drawer for each product added to cart
        setAddedProductPopup({
          item: addedItem,
          quantityAdded: quantity,
          timestamp: Date.now(),
        });

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

  const updateQuantity = async (variantId, quantity, availableStock = null) => {
    const existing = cart.items?.find((i) => i.variantId === variantId);
    if (!existing && quantity > 0) {
      return { success: false, message: 'Item not found in cart' };
    }

    const stockLimit = availableStock !== null && availableStock !== undefined 
      ? availableStock 
      : (existing?.availableStock !== undefined ? existing.availableStock : null);

    // Hard ceiling: Customer cannot order more than available stock
    if (stockLimit !== null && stockLimit !== undefined && quantity > stockLimit) {
      const msg = `Maximum available stock is ${stockLimit}`;
      setError(msg);
      return { success: false, message: msg };
    }

    const previousCart = cart;

    // Optimistically update local cart immediately for instant fluid UI feedback
    const updatedItems = quantity <= 0
      ? (cart.items || []).filter((i) => i.variantId !== variantId)
      : (cart.items || []).map((i) => {
          if (i.variantId === variantId) {
            const price = Number(i.unitPriceInr) || 0;
            return {
              ...i,
              quantity,
              lineTotalInr: Number((price * quantity).toFixed(2)),
              inStock: stockLimit === null || stockLimit === undefined ? true : quantity <= stockLimit,
            };
          }
          return i;
        });

    const optimisticCart = recalculateOptimisticTotals(updatedItems, cart);
    setCart(optimisticCart);
    setError(null);

    // Keep addedProductPopup in sync if it is currently open for this variant
    if (addedProductPopup && (addedProductPopup.item?.variantId === variantId || addedProductPopup.item?.id === variantId)) {
      if (quantity <= 0) {
        setAddedProductPopup(null);
      } else {
        const updatedItem = updatedItems.find((i) => i.variantId === variantId);
        setAddedProductPopup((prev) => prev ? {
          ...prev,
          item: updatedItem || prev.item,
          timestamp: Date.now(),
        } : null);
      }
    }

    // In-flight coalescing: If a request for this variant is currently processing,
    // queue the target quantity and let the current execution loop process it
    if (inFlightUpdates.current.has(variantId)) {
      inFlightUpdates.current.set(variantId, quantity);
      return { success: true };
    }

    inFlightUpdates.current.set(variantId, quantity);

    try {
      while (inFlightUpdates.current.has(variantId)) {
        const targetQty = inFlightUpdates.current.get(variantId);
        const response = await cartApi.updateItemQuantity(variantId, targetQty);
        
        const latestQueued = inFlightUpdates.current.get(variantId);
        if (latestQueued === targetQty) {
          inFlightUpdates.current.delete(variantId);
          if (response.data && response.data.success) {
            setCart(normalizeCartData(response.data.data));
          }
          break;
        }
      }
      return { success: true };
    } catch (err) {
      inFlightUpdates.current.delete(variantId);
      setCart(previousCart);
      const msg = err.response?.data?.error?.message || err.message || 'Failed to update quantity';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const removeFromCart = async (variantId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartApi.removeItem(variantId);
      if (response.data && response.data.success) {
        setCart(normalizeCartData(response.data.data));
        if (addedProductPopup && (addedProductPopup.item?.variantId === variantId || addedProductPopup.item?.id === variantId)) {
          setAddedProductPopup(null);
        }
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
        setCart(normalizeCartData(response.data.data));
        setAddedProductPopup(null);
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
        const normalized = normalizeCartData(response.data.data);
        setCart(normalized);
        return normalized;
      }
    } catch (err) {
      console.error('Failed to merge guest cart:', err);
      return await fetchCart();
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

  const applyPromotion = async (code) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartApi.applyPromotion(code);
      if (response.data && response.data.success) {
        const norm = normalizeCartData(response.data.data);
        setCart(norm);
        return { success: true, cart: norm, message: norm.promoMessage };
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to apply promotion code';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const removePromotion = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartApi.removePromotion();
      if (response.data && response.data.success) {
        const norm = normalizeCartData(response.data.data);
        setCart(norm);
        return { success: true, cart: norm };
      }
    } catch (err) {
      setError('Failed to remove promotion');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isDrawerOpen,
        setIsDrawerOpen,
        addedProductPopup,
        setAddedProductPopup,
        closePopupDrawer: () => setAddedProductPopup(null),
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
        applyPromotion,
        removePromotion,
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
