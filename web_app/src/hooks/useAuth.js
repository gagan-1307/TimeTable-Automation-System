import { useState } from 'react';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminId, setAdminId] = useState('');

  const login = (id, password) => {
    // NOTE: Sample credentials for now. Replace with backend auth later.
    const validId = '123103054@nitkkr.ac.in';
    const validPassword = '9499276265';

    if (id === validId && password === validPassword) {
      setAdminId(id);
      setIsAuthenticated(true);
      return true;
    }

    setAdminId('');
    setIsAuthenticated(false);
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAdminId('');
  };

  return { isAuthenticated, adminId, login, logout };
};
