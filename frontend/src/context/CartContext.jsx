import { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (item) => {
    setCartItems(prev => {
      // Match by itemId + same modifiers + same instructions
      const idx = prev.findIndex(c =>
        c.menuItemId === item.menuItemId &&
        JSON.stringify(c.selectedModifiers) === JSON.stringify(item.selectedModifiers) &&
        c.specialInstructions === item.specialInstructions
      );
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + item.quantity };
        return updated;
      }
      return [...prev, { ...item, cartId: Date.now() + Math.random() }];
    });
  };

  const removeFromCart = (cartId) =>
    setCartItems(prev => prev.filter(c => c.cartId !== cartId));

  const updateQuantity = (cartId, quantity) => {
    if (quantity < 1) return removeFromCart(cartId);
    setCartItems(prev => prev.map(c => c.cartId === cartId ? { ...c, quantity } : c));
  };

  const clearCart = () => setCartItems([]);

  const totalItems  = cartItems.reduce((s, c) => s + c.quantity, 0);
  const totalAmount = cartItems.reduce((s, c) => {
    const modExtra = (c.selectedModifiers || []).reduce((ms, m) => ms + (m.extraPrice || 0), 0);
    return s + (c.price + modExtra) * c.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalAmount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);