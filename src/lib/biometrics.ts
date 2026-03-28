import { Capacitor } from '@capacitor/core';

// Dynamic import to avoid errors on web
let NativeBiometric: any = null;

const loadPlugin = async () => {
  if (!NativeBiometric && Capacitor.isNativePlatform()) {
    const mod = await import('capacitor-native-biometric');
    NativeBiometric = mod.NativeBiometric;
  }
  return NativeBiometric;
};

const SERVER = 'app.sigwallet.auth';

export const isBiometricAvailable = async (): Promise<boolean> => {
  try {
    const plugin = await loadPlugin();
    if (!plugin) return false;
    const result = await plugin.isAvailable();
    return result.isAvailable;
  } catch {
    return false;
  }
};

export const saveCredentials = async (email: string, password: string): Promise<void> => {
  const plugin = await loadPlugin();
  if (!plugin) return;
  await plugin.setCredentials({
    username: email,
    password,
    server: SERVER,
  });
  localStorage.setItem('biometric_enabled', 'true');
};

export const getCredentials = async (): Promise<{ username: string; password: string } | null> => {
  try {
    const plugin = await loadPlugin();
    if (!plugin) return null;
    if (localStorage.getItem('biometric_enabled') !== 'true') return null;
    
    // Prompt Face ID / Touch ID
    await plugin.verifyIdentity({
      reason: 'Mit Face ID anmelden',
      title: 'Anmelden',
    });
    
    // If verification passed, get stored credentials
    const creds = await plugin.getCredentials({ server: SERVER });
    return creds;
  } catch {
    return null;
  }
};

export const deleteCredentials = async (): Promise<void> => {
  try {
    const plugin = await loadPlugin();
    if (!plugin) return;
    await plugin.deleteCredentials({ server: SERVER });
  } catch {
    // ignore
  }
  localStorage.removeItem('biometric_enabled');
};

export const isBiometricEnabled = (): boolean => {
  return localStorage.getItem('biometric_enabled') === 'true';
};
