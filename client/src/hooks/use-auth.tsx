import { createContext, useContext, ReactNode } from "react";

interface AuthUser {
  id: number;
  username: string;
  displayName: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const staticUser: AuthUser = {
  id: 1,
  username: "traveler",
  displayName: "Traveler",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ user: staticUser, isLoading: false, logout: async () => {} }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
