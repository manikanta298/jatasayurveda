import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import {
  getCurrentCustomer,
  googleLoginCustomer,
  logoutCustomer,
  sendCustomerOtp,
  registerCustomer,
  loginCustomer,
  resetCustomerPassword,
  updateCustomerProfile,
} from "./queries";

const Ctx = createContext({
  customer: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  sendOtp: async () => {},
  resetPassword: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
});

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, silently check if there's already a valid session cookie
  // (e.g. the customer signed in on a previous visit). A 401 here just means
  // "not signed in" — not an error worth surfacing.
  useEffect(() => {
    getCurrentCustomer()
      .then(setCustomer)
      .catch(() => setCustomer(null))
      .finally(() => setLoading(false));
  }, []);

  const sendOtp = useCallback(async (email, purpose = "register") => {
    return sendCustomerOtp({ email, purpose });
  }, []);

  const register = useCallback(async ({ name, email, password, otp }) => {
    const result = await registerCustomer({ name, email, password, otp });
    setCustomer(result.customer);
    return result.customer;
  }, []);

  const login = useCallback(async (email, password, rememberMe) => {
    const result = await loginCustomer({ email, password, rememberMe });
    setCustomer(result.customer);
    return result.customer;
  }, []);

  // No session is established by this — the customer still has to log in
  // afterward with their new password, same as any "forgot password" flow.
  const resetPassword = useCallback(async ({ email, otp, newPassword }) => {
    return resetCustomerPassword({ email, otp, newPassword });
  }, []);

  const loginWithGoogle = useCallback(async (credential) => {
    const result = await googleLoginCustomer({ credential });
    setCustomer(result.customer);
    return result.customer;
  }, []);

  const logout = useCallback(async () => {
    await logoutCustomer().catch(() => {});
    setCustomer(null);
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const updated = await updateCustomerProfile(payload);
    setCustomer(updated);
    return updated;
  }, []);

  const value = useMemo(
    () => ({ customer, loading, login, register, sendOtp, resetPassword, loginWithGoogle, logout, updateProfile }),
    [customer, loading, login, register, sendOtp, resetPassword, loginWithGoogle, logout, updateProfile]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCustomerAuth() {
  return useContext(Ctx);
}
