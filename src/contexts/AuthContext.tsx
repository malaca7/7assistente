import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminProfile, SystemRole } from '../types';
import { StorageService } from '../lib/storage';

interface AuthContextType {
  user: AdminProfile | null;
  role: SystemRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, numericPassword: string) => Promise<{ success: boolean; error?: string }>;
  loginWithPhone: (phoneOrUsername: string, pinOrPass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<AdminProfile>) => Promise<void>;
  isCEO: boolean;
  isManager: boolean;
  isAttendant: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      try {
        const session = StorageService.getSession();
        if (session && session.authenticated && (session.username || session.phone)) {
          const profile = await StorageService.getAdminProfile();
          setUser({
            ...profile,
            role: (session.role as SystemRole) || profile.role || 'ceo',
          });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (
    usernameInput: string, 
    passwordNumeric: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const cleanUser = String(usernameInput || '').trim().toLowerCase();
      const cleanPass = String(passwordNumeric || '').trim();

      // Validação Estrita 1: Usuário APENAS LETRAS
      if (!cleanUser || !/^[a-zA-Z]+$/.test(cleanUser)) {
        return { 
          success: false, 
          error: 'O nome de usuário deve conter apenas letras (sem números, espaços ou símbolos).' 
        };
      }

      // Validação Estrita 2: Senha APENAS NÚMEROS
      if (!cleanPass || !/^[0-9]+$/.test(cleanPass)) {
        return { 
          success: false, 
          error: 'A senha de acesso deve conter apenas números (sem letras, espaços ou símbolos).' 
        };
      }

      const check = await StorageService.verifyUserAccess(cleanUser, cleanPass);
      if (check.success && check.user) {
        setUser(check.user);
        StorageService.setSession({ 
          authenticated: true, 
          username: check.user.username || cleanUser,
          role: check.user.role,
          name: check.user.name,
          store_id: check.user.store_id || null,
          store_name: check.user.store_name,
        });
        return { success: true };
      }

      return { 
        success: false, 
        error: check.error || 'Credenciais inválidas. Verifique o usuário e a senha.' 
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro no processo de login' };
    } finally {
      setIsLoading(false);
    }
  };

  // Wrapper para compatibilidade com chamadas existentes
  const loginWithPhone = async (
    phoneOrUsername: string, 
    pinOrPass: string
  ): Promise<{ success: boolean; error?: string }> => {
    return login(phoneOrUsername, pinOrPass);
  };

  const logout = async () => {
    StorageService.setSession(null);
    setUser(null);
  };

  const updateProfile = async (profile: Partial<AdminProfile>) => {
    const updated = await StorageService.saveAdminProfile(profile);
    setUser(updated);
  };

  const role: SystemRole = user?.role || 'ceo';
  const isCEO = role === 'ceo' || role === 'admin';
  const isManager = role === 'manager';
  const isAttendant = role === 'attendant';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        loginWithPhone,
        logout,
        updateProfile,
        isCEO,
        isManager,
        isAttendant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
