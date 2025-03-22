// src/CONTEXTS/cartContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';

import PropTypes from 'prop-types';

export const CartContext = createContext();

// Hook para acceder al contexto del carrito
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
    setCartCount(itemCount);
  };

  const clearCart = () => {
    localStorage.removeItem('cart');
    setCartCount(0);
  };

  useEffect(() => {
    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    return () => window.removeEventListener('storage', updateCartCount);
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, updateCartCount, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

//  Se movió fuera de la función para evitar "unreachable code"
CartProvider.propTypes = {
  children: PropTypes.node.isRequired, // Incluye cualquier elemento renderizable en React
};
