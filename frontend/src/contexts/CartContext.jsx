import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { API_BASE_URL } from '../services/api';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [itemCount, setItemCount] = useState(0);

  // Fetch cart data from backend
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/customer/cart`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Unable to load cart at the moment.');
      }

      const data = await response.json();
      const items = Array.isArray(data?.items) ? data.items : [];

      setCartItems(items);
      setSubtotal(data?.subtotal ?? 0);
      setShipping(data?.shipping ?? 0);
      setTotal(data?.total ?? 0);
      setItemCount(items.reduce((sum, item) => sum + (item.quantity || 0), 0));
      setError(null);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError(err.message || 'Unable to load cart at the moment.');
      // Keep existing cart items on error (don't clear)
    } finally {
      setLoading(false);
    }
  }, []);

  // Add product to cart (calls backend, then updates context)
  const addToCart = useCallback(
    async (productId, quantity) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/customer/cart/add`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({ productId, quantity })
        });

        const data = await response.json();
        if (response.ok && data?.success) {
          // Fetch updated cart from backend
          await fetchCart();
          return { success: true, message: data?.message || 'Added to cart' };
        } else {
          throw new Error(data?.message || 'Failed to add to cart');
        }
      } catch (err) {
        console.error('Error adding to cart:', err);
        const errorMessage = err.message || 'Failed to add to cart';
        setError(errorMessage);
        return { success: false, message: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [fetchCart]
  );

  // Remove product from cart (calls backend, then updates context)
  const removeFromCart = useCallback(
    async (productId) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/customer/cart/remove`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({ productId })
        });

        const data = await response.json();
        if (response.ok && data?.success) {
          // Fetch updated cart from backend
          await fetchCart();
          return { success: true, message: data?.message || 'Item removed' };
        } else {
          throw new Error(data?.message || 'Failed to remove item');
        }
      } catch (err) {
        console.error('Error removing from cart:', err);
        const errorMessage = err.message || 'Failed to remove item';
        setError(errorMessage);
        return { success: false, message: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [fetchCart]
  );

  // Update quantity in cart (calls backend if endpoint exists, otherwise use add/remove)
  const updateQuantity = useCallback(
    async (productId, quantity) => {
      // For now, we'll remove and re-add with new quantity
      // This could be optimized with a dedicated update endpoint
      if (quantity <= 0) {
        return await removeFromCart(productId);
      }

      // Find current quantity
      const currentItem = cartItems.find(item => item.productId === productId);
      const currentQuantity = currentItem?.quantity || 0;
      const difference = quantity - currentQuantity;

      if (difference === 0) {
        return { success: true, message: 'Quantity unchanged' };
      }

      // Use add or remove based on difference
      if (difference > 0) {
        return await addToCart(productId, difference);
      } else {
        // For decreasing quantity, we'd need a dedicated endpoint
        // For now, we'll remove and re-add
        const removeResult = await removeFromCart(productId);
        if (removeResult.success && quantity > 0) {
          return await addToCart(productId, quantity);
        }
        return removeResult;
      }
    },
    [cartItems, addToCart, removeFromCart]
  );

  // Clear cart (useful after checkout)
  const clearCart = useCallback(() => {
    setCartItems([]);
    setSubtotal(0);
    setShipping(0);
    setTotal(0);
    setItemCount(0);
    setError(null);
  }, []);

  // Auto-fetch cart when on customer pages
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/customer') && cartItems.length === 0 && !loading) {
      fetchCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const value = {
    cartItems,
    subtotal,
    shipping,
    total,
    itemCount,
    loading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    fetchCart,
    clearCart,
    isEmpty: cartItems.length === 0
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

