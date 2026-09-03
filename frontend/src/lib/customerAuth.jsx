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
import { setCustomerAuthToken, clearCustomerAuthToken } from "./api";

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

  // On first load, use the persistent httpOnly cookie. If it is available,
  // the frontend does not need to hold a token in JavaScript memory.
  useEffect(() => {
    getCurrentCustomer()
      .then((current) => {
        setCustomer(current);
      })
      .catch(() => setCustomer(null))
      .finally(() => setLoading(false));
  }, []);

  const sendOtp = useCallback(async (email, purpose = "register") => {
    return sendCustomerOtp({ email, purpose });
  }, []);

  const register = useCallback(async ({ name, email, password, otp }) => {
    const result = await registerCustomer({ name, email, password, otp });
    setCustomerAuthToken(result.token);
    setCustomer(result.customer);
    return result.customer;
  }, []);

  const login = useCallback(async (email, password, rememberMe) => {
    const result = await loginCustomer({ email, password, rememberMe });
    setCustomerAuthToken(result.token);
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
    setCustomerAuthToken(result.token);
    setCustomer(result.customer);
    return result.customer;
  }, []);

  const logout = useCallback(async () => {
    await logoutCustomer().catch(() => {});
    clearCustomerAuthToken();
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
