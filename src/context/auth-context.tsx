import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { signInWithApi } from "@/services/auth/auth-api";
import {
  clearStoredToken,
  getStoredToken,
  storeToken,
} from "@/services/auth/token-storage";

type AuthContextValue = {
  session: string | null;
  isLoading: boolean;
  initializationError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  retrySessionRestore: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Ocorreu um erro ao restaurar a sessão.";
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(
    null,
  );

  const retrySessionRestore = useCallback(async () => {
    setIsLoading(true);
    setInitializationError(null);

    try {
      setSession(await getStoredToken());
    } catch (error) {
      setInitializationError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    getStoredToken()
      .then((storedToken) => {
        if (isActive) {
          setSession(storedToken);
          setInitializationError(null);
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setInitializationError(getErrorMessage(error));
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const token = await signInWithApi(email, password);
    await storeToken(token);
    setSession(token);
  }, []);

  const signOut = useCallback(async () => {
    await clearStoredToken();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      isLoading,
      initializationError,
      signIn,
      signOut,
      retrySessionRestore,
    }),
    [
      session,
      isLoading,
      initializationError,
      signIn,
      signOut,
      retrySessionRestore,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth precisa ser usado dentro de um AuthProvider.");
  }

  return context;
}
