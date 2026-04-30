import { createContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getMe } from '../api/authApi';
import { createRestaurant } from '../api/restaurantApi';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [owner,             setOwner]             = useState(null);
  const [restaurants,       setRestaurants]       = useState([]);
  const [currentRestaurant, setCurrentRestaurant] = useState(null);
  const [loading,           setLoading]           = useState(true);

  const applyData = (data) => {
    setOwner(data);
    setRestaurants(data.restaurants || []);
    setCurrentRestaurant(prev =>
      prev
        ? data.restaurants.find(r => r._id === prev._id) || data.restaurants[0]
        : data.restaurants[0]
    );
  };

  useEffect(() => {
    const token = localStorage.getItem('qrunch_token');
    if (token) {
      getMe(token)
        .then(data => applyData({ ...data, token }))
        .catch(() => localStorage.removeItem('qrunch_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    localStorage.setItem('qrunch_token', data.token);
    applyData(data);
    return data;
  };

  const register = async (form) => {
    const data = await registerUser(form);
    localStorage.setItem('qrunch_token', data.token);
    applyData(data);
    return data;
  };

  const loginWithGoogle = (data) => {
    localStorage.setItem('qrunch_token', data.token);
    applyData(data);
  };

  const logout = () => {
    localStorage.removeItem('qrunch_token');
    setOwner(null);
    setRestaurants([]);
    setCurrentRestaurant(null);
  };

  const switchRestaurant = (restaurantId) => {
    const r = restaurants.find(r => r._id === restaurantId);
    if (r) setCurrentRestaurant(r);
  };

  const addRestaurant = async (name) => {
    const token         = localStorage.getItem('qrunch_token');
    const newRestaurant = await createRestaurant(name, token);
    setRestaurants(prev => [...prev, newRestaurant]);
    setCurrentRestaurant(newRestaurant);
    return newRestaurant;
  };

  const updateOwner = (updates) => {
    setOwner(prev => ({ ...prev, ...updates }));
  };

  // Updates restaurants list + refreshes currentRestaurant
  const updateRestaurants = (updatedRestaurants) => {
    setRestaurants(updatedRestaurants);
    setCurrentRestaurant(prev =>
      prev
        ? updatedRestaurants.find(r => r._id === prev._id) || updatedRestaurants[0]
        : updatedRestaurants[0]
    );
  };

  return (
    <AuthContext.Provider value={{
      user: owner, owner, restaurants, currentRestaurant,
      loading, login, register, loginWithGoogle,
      logout, switchRestaurant, addRestaurant,
      updateOwner, updateRestaurants
    }}>
      {children}
    </AuthContext.Provider>
  );
};