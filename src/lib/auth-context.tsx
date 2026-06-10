import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { ADMIN_EMAIL, getFirebase } from "./firebase";

interface AuthContextValue {
  user: User | null;
  userName: string;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  setUserName: (name: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const NAME_KEY = "wedding_user_name";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserNameState] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(NAME_KEY) ?? "";
    setUserNameState(stored);
    const { auth } = getFirebase();
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const setUserName = useCallback((name: string) => {
    setUserNameState(name);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(NAME_KEY, name);
    }
  }, []);

  const signIn = useCallback(
    async (email: string, password: string, name: string) => {
      const { auth } = getFirebase();
      if (!auth) throw new Error("Firebase not ready");
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setUserName(name.trim());
    },
    [setUserName],
  );

  const logout = useCallback(async () => {
    const { auth } = getFirebase();
    if (!auth) return;
    await signOut(auth);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      userName,
      isAdmin: !!user && user.email?.toLowerCase() === ADMIN_EMAIL,
      loading,
      signIn,
      logout,
      setUserName,
    }),
    [user, userName, loading, signIn, logout, setUserName],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
