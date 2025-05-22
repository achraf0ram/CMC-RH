// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

// Define User type
interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

// Define context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ) => Promise<{ success: boolean; errors?: Record<string, string[]> }>;
  logout: () => Promise<void>;
  error: string | null;
  validationErrors: Record<string, string[]> | null;
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

  const getCsrf = async () => {
    await api.get("/sanctum/csrf-cookie");
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        await getCsrf();
        const res = await api.get("api/user");
        console.log("User data:", res.data);
        setUser(res.data);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setValidationErrors(null);
    try {
      await getCsrf();
      const res = await api.post("/login", { email, password });
      setUser(res.data.user || res.data); // Adjust to your Laravel response
      return true;
    } catch (err: any) {
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        setValidationErrors(errors);
        setError("Validation failed");
        return false;
      }
      const errorMessage = err.response?.data?.message || "Login failed";
      setError(errorMessage);
      return false;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string
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
      });
      setUser(res.data.user || res.data); // Adjust to your Laravel response
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
