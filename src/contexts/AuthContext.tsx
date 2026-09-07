import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminProfile, SystemRole } from '../types';
import { StorageService } from '../lib/storage';

interface AuthContextType {
  user: AdminProfile | null;
  role: SystemRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithPhone: (phone: string, pinOrPass: string) => Promise<{ success: boolean; error?: string }>;
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
        if (session && session.authenticated && session.phone) {
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

  const loginWithPhone = async (
    phone: string, 
    pinOrPass: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 8) {
        return { success: false, error: 'Por favor, insira um número de telefone com DDD.' };
      }
      if (!pinOrPass || pinOrPass.trim().length === 0) {
        return { success: false, error: 'Por favor, insira sua senha de acesso.' };
      }

      const check = await StorageService.verifyUserAccess(cleanPhone, pinOrPass);
      if (check.success && check.user) {
        setUser(check.user);
        StorageService.setSession({ 
          authenticated: true, 
          phone: cleanPhone, 
          role: check.user.role 
        });
        return { success: true };
      }

      return { 
        success: false, 
        error: check.error || 'Telefone ou senha inválidos. Tente telefone: 81996138924 e senha: admin' 
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro no processo de login' };
    } finally {
      setIsLoading(false);
    }
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
