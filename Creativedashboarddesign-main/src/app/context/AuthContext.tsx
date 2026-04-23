import React, { createContext, useContext, useState, useEffect } from "react";

type Role = "manager" | "cashier" | null;

interface User {
  username: string;
  role: Role;
  initials: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, role: Role) => void;
  logout: () => void;
  onboardingCompleted: boolean;
  completeOnboarding: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  // Auto-login for demo purposes or check localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("pos_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    const ob = localStorage.getItem("pos_ob");
    if (ob) {
      setOnboardingCompleted(true);
    }
  }, []);

  const login = (username: string, role: Role) => {
    const initials = username.substring(0, 2).toUpperCase();
    const newUser = { username, role, initials };
    setUser(newUser);
    localStorage.setItem("pos_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("pos_user");
  };

  const completeOnboarding = () => {
    setOnboardingCompleted(true);
    localStorage.setItem("pos_ob", "true");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, onboardingCompleted, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
