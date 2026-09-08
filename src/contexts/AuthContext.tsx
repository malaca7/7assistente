import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminProfile, SystemRole } from '../types';
import { StorageService } from '../lib/storage';

interface AuthContextType {
  user: AdminProfile | null;
  role: SystemRole;
  panels: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, numericPassword: string) => Promise<{ success: boolean; error?: string; targetPath?: string }>;
  loginWithPhone: (phoneOrUsername: string, pinOrPass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<AdminProfile>) => Promise<void>;
  isCEO: boolean;
  isManager: boolean;
  isAttendant: boolean;
  hasAdminAccess: boolean;
  hasManagerAccess: boolean;
  hasAttendantAccess: boolean;
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
          const userPanels = session.panels || profile.panels || (
            profile.role === 'ceo' || profile.role === 'admin' 
              ? ['admin', 'gerente', 'atendimento'] 
              : profile.role === 'manager' 
              ? ['gerente'] 
              : ['atendimento']
          );
          setUser({
            ...profile,
            role: (session.role as SystemRole) || profile.role || 'ceo',
            panels: userPanels,
            allowed_panels: session.allowed_panels || profile.allowed_panels || userPanels,
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
        const userPanels = check.user.panels || (
          check.user.role === 'ceo' || check.user.role === 'admin' 
            ? ['admin', 'gerente', 'atendimento'] 
            : check.user.role === 'manager' 
            ? ['gerente'] 
            : ['atendimento']
        );

        let targetPath = '/atendimento';
        if (userPanels.includes('admin')) targetPath = '/admin';
        else if (userPanels.includes('gerente')) targetPath = '/gerente';

        setUser(check.user);
        StorageService.setSession({ 
          authenticated: true, 
          username: check.user.username || cleanUser,
          role: check.user.role,
          panels: userPanels,
          allowed_panels: check.user.allowed_panels || userPanels,
          name: check.user.name,
          store_id: check.user.store_id || null,
          store_name: check.user.store_name,
        });
        return { success: true, targetPath };
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

  const panels = user?.panels || (user?.role === 'ceo' || user?.role === 'admin' ? ['admin', 'gerente', 'atendimento'] : user?.role === 'manager' ? ['gerente'] : ['atendimento']);
  const hasAdminAccess = panels.includes('admin') || user?.role === 'ceo' || user?.role === 'admin';
  const hasManagerAccess = panels.includes('gerente') || hasAdminAccess;
  const hasAttendantAccess = panels.includes('atendimento') || hasAdminAccess || hasManagerAccess;

  const role: SystemRole = user?.role || (hasAdminAccess ? 'admin' : hasManagerAccess ? 'manager' : 'attendant');
  const isCEO = hasAdminAccess;
  const isManager = hasManagerAccess;
  const isAttendant = hasAttendantAccess;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        panels,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        loginWithPhone,
        logout,
        updateProfile,
        isCEO,
        isManager,
        isAttendant,
        hasAdminAccess,
        hasManagerAccess,
        hasAttendantAccess,
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
