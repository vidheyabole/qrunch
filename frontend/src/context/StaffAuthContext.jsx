import { createContext, useState, useEffect } from 'react';
import i18n from '../i18n';

export const StaffAuthContext = createContext();

export const StaffAuthProvider = ({ children }) => {
  const [staff,   setStaff]   = useState(null);
  const [loading, setLoading] = useState(true);

  // Apply staff's saved language
  const applyLanguage = (lang) => {
    if (lang && ['en', 'hi', 'mr'].includes(lang)) {
      i18n.changeLanguage(lang);
      localStorage.setItem('qrunch_ui_lang', lang);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('qrunch_staff_token');
    if (token) {
      fetch('/api/staff/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => {
          if (data._id) {
            setStaff({ ...data, token });
            applyLanguage(data.language); // ← apply saved language on page refresh
          } else {
            localStorage.removeItem('qrunch_staff_token');
          }
        })
        .catch(() => localStorage.removeItem('qrunch_staff_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const staffLogin = async (loginId, password) => {
    const res  = await fetch('/api/staff/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ loginId, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    localStorage.setItem('qrunch_staff_token', data.token);
    setStaff({ ...data.staff, token: data.token });
    applyLanguage(data.staff.language); // ← apply saved language on login
    return data;
  };

  const staffLogout = () => {
    localStorage.removeItem('qrunch_staff_token');
    setStaff(null);
    i18n.changeLanguage('en'); // reset to English on logout
  };

  // Called from StaffLayout when staff changes language
  const updateStaffLanguage = async (lang, token) => {
    try {
      await fetch('/api/staff/me/language', {
        method:  'PUT',
        headers: {
          Authorization:  `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ language: lang })
      });
      setStaff(prev => prev ? { ...prev, language: lang } : prev);
    } catch (err) {
      console.error('Failed to save language:', err.message);
    }
  };

  return (
    <StaffAuthContext.Provider value={{
      staff, loading, staffLogin, staffLogout, updateStaffLanguage
    }}>
      {children}
    </StaffAuthContext.Provider>
  );
};