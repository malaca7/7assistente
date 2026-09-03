import React, { createContext, useContext, useState, useEffect } from 'react';
import { Attendant } from '../types';
import { StorageService } from '../lib/storage';

interface AttendantAuthContextType {
  currentAttendant: Attendant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrPhone: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateStatus: (status: 'online' | 'busy' | 'offline') => Promise<void>;
  attendants: Attendant[];
  refreshAttendants: () => Promise<void>;
}

const AttendantAuthContext = createContext<AttendantAuthContextType | undefined>(undefined);

const ATTENDANT_SESSION_KEY = '7assistente_attendant_auth_session';

export const AttendantAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentAttendant, setCurrentAttendant] = useState<Attendant | null>(null);
  const [attendants, setAttendants] = useState<Attendant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAttendants = async () => {
    try {
      const list = await StorageService.getAttendants();
      setAttendants(list);
      if (currentAttendant) {
        const fresh = list.find((a) => a.id === currentAttendant.id);
        if (fresh) setCurrentAttendant(fresh);
      }
    } catch (e) {
      console.error('Error refreshing attendants:', e);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        const list = await StorageService.getAttendants();
        setAttendants(list);

        const savedSession = localStorage.getItem(ATTENDANT_SESSION_KEY);
        if (savedSession) {
          const parsed = JSON.parse(savedSession) as Attendant;
          const matched = list.find((a) => a.id === parsed.id || a.email === parsed.email);
          if (matched) {
            setCurrentAttendant(matched);
          } else if (list.length > 0) {
            setCurrentAttendant(list[0]);
          }
        }
      } catch (e) {
        console.error('Error initializing attendant auth:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (emailOrPhone: string, password: string): Promise<boolean> => {
    // 1. Check via System Users with can_access_atendimento permission
    try {
      const userCheck = await StorageService.verifyUserAccess(emailOrPhone, password, 'can_access_atendimento');
      if (userCheck.success && userCheck.user) {
        const onlineAttendant: Attendant = {
          id: userCheck.user.id,
          name: userCheck.user.name,
          email: `${userCheck.user.phone}@atendente.local`,
          phone: userCheck.user.phone,
          password: userCheck.user.password || password,
          role: 'atendente',
          status: 'online',
          active_chats_count: 0,
        };
        setCurrentAttendant(onlineAttendant);
        localStorage.setItem(ATTENDANT_SESSION_KEY, JSON.stringify(onlineAttendant));
        return true;
      }
    } catch {}

    // 2. Fallback to existing attendants list
    const list = await StorageService.getAttendants();
    setAttendants(list);

    const cleanInput = emailOrPhone.trim().toLowerCase().replace(/\D/g, '');
    const found = list.find((a) => {
      const aPhone = (a.phone || '').replace(/\D/g, '');
      const matchEmail = a.email.toLowerCase().trim() === emailOrPhone.trim().toLowerCase();
      const matchPhone = cleanInput.length >= 8 && (aPhone === cleanInput || aPhone.endsWith(cleanInput));
      return (matchEmail || matchPhone) && a.password === password;
    });

    if (found) {
      const onlineAttendant: Attendant = { ...found, status: 'online' };
      setCurrentAttendant(onlineAttendant);
      localStorage.setItem(ATTENDANT_SESSION_KEY, JSON.stringify(onlineAttendant));
      await StorageService.saveAttendant(onlineAttendant);
      return true;
    }

    return false;
  };

  const logout = () => {
    if (currentAttendant) {
      const offlineAttendant: Attendant = { ...currentAttendant, status: 'offline' };
      StorageService.saveAttendant(offlineAttendant).catch(() => {});
    }
    setCurrentAttendant(null);
    localStorage.removeItem(ATTENDANT_SESSION_KEY);
  };

  const updateStatus = async (status: 'online' | 'busy' | 'offline') => {
    if (!currentAttendant) return;
    const updated: Attendant = { ...currentAttendant, status };
    setCurrentAttendant(updated);
    localStorage.setItem(ATTENDANT_SESSION_KEY, JSON.stringify(updated));
    await StorageService.saveAttendant(updated);
    await refreshAttendants();
  };

  return (
    <AttendantAuthContext.Provider
      value={{
        currentAttendant,
        isAuthenticated: Boolean(currentAttendant),
        isLoading,
        login,
        logout,
        updateStatus,
        attendants,
        refreshAttendants,
      }}
    >
      {children}
    </AttendantAuthContext.Provider>
  );
};

export const useAttendantAuth = (): AttendantAuthContextType => {
  const context = useContext(AttendantAuthContext);
  if (!context) {
    throw new Error('useAttendantAuth must be used within an AttendantAuthProvider');
  }
  return context;
};
