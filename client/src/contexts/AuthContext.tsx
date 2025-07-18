// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { playMessageSound } from '../utils/sounds';

// Define User type
interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  is_admin: boolean;
  profile_photo_url?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; isAdmin?: boolean; errors?: Record<string, string[]> }>;
  register: (name: string, email: string, password: string, passwordConfirmation: string, phone: string) => Promise<{ success: boolean; errors?: Record<string, string[]> }>;
  logout: () => Promise<void>;
  error: string | null;
  validationErrors: Record<string, string[]> | null;
  token: string | null;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create axios instance
const api = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// AuthProvider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<
    string,
    string[]
  > | null>(null);
  // أضف token إلى state
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  const getCsrf = async () => {
    await api.get("/sanctum/csrf-cookie");
  };
  
  const fetchUser = async () => {
    try {
      // إذا كان هناك توكن في localStorage ولم يتم وضعه في الهيدر، أضفه
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        setToken(storedToken);
      }
      const res = await api.get("api/user");
      setUser(res.data);
      return res.data;
    } catch {
      setUser(null);
      setToken(null);
      return null;
    }
  };

  // دالة منفصلة لتحديث شعار المستخدم الحالي
  const fetchUserAvatar = async () => {
    if (!user) return;
    try {
      const res = await api.get("api/user");
      // تحديث الشعار فقط إذا تغير
      if (res.data.profile_photo_url !== user.profile_photo_url) {
        setUser(prev => prev ? { ...prev, profile_photo_url: res.data.profile_photo_url } : null);
      }
    } catch {
      // لا نعرض خطأ هنا لأنها تحديث تلقائي للشعار فقط
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      await getCsrf();
      await fetchUser();
      setIsLoading(false);
    };
    initAuth();
  }, []);

  // تحديث شعار المستخدم الحالي كل 5 ثوانٍ
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(fetchUserAvatar, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; isAdmin?: boolean; errors?: Record<string, string[]> }> => {
    setError(null);
    setValidationErrors(null);
    try {
      await getCsrf();
      const res = await api.post("/login", {
        email,
        password,
      });
      const userData = res.data.user;
      setUser(userData);
      if (res.data.token) {
        setToken(res.data.token);
        localStorage.setItem('token', res.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      }
      await fetchUser();
      return { success: true, isAdmin: userData?.is_admin };
    } catch (err: any) {
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        setValidationErrors(errors);
        setError("Validation failed");
        return { success: false, errors };
      }
      const errorMessage = err.response?.data?.message || "Login failed";
      setError(errorMessage);
      return { success: false, errors: { general: [errorMessage] } };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string,
    phone: string
  ): Promise<{ success: boolean; errors?: Record<string, string[]> }> => {
    setError(null);
    setValidationErrors(null);
    try {
      await getCsrf();
      const res = await axios.post("http://localhost:8000/register", {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        phone,
      });
      await fetchUser(); // Fetch user after registration
      setUser(await fetchUser());
      return { success: true };
    } catch (err: any) {
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        setValidationErrors(errors);
        setError("Validation failed");
        return { success: false, errors };
      }
      const errorMessage = err.response?.data?.message || "Registration failed";
      setError(errorMessage);
      return { success: false, errors: { general: [errorMessage] } };
    }
  };

  const logout = async () => {
    try {
      await api.post("/logout");
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    } catch (err: any) {
      setError(err.response?.data?.message || "Logout failed");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        error,
        validationErrors,
        token, // أضف التوكن هنا
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};