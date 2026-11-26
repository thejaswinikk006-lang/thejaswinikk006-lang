import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  getCurrentFarmer,
  loginFarmer,
  logoutFarmer,
  registerFarmer,
  updateFarmerProfile,
} from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getCurrentFarmer()
      .then(({ user: farmer }) => {
        if (active) setUser(farmer);
      })
      .catch((requestError) => {
        if (active && requestError.status !== 401) {
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function signIn(credentials) {
    const result = await loginFarmer(credentials);
    setUser(result.user);
    setError('');
    return result.user;
  }

  async function createAccount(details) {
    const result = await registerFarmer(details);
    setUser(result.user);
    setError('');
    return result.user;
  }

  async function saveProfile(profile) {
    const result = await updateFarmerProfile(profile);
    setUser(result.user);
    return result.user;
  }

  async function signOut() {
    await logoutFarmer();
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      signIn,
      createAccount,
      saveProfile,
      signOut,
    }),
    [user, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
