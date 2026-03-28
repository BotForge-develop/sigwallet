import { Capacitor } from '@capacitor/core';

// Dynamic import to avoid errors on web
let NativeBiometric: any = null;

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_ACCOUNT_KEY = 'biometric_account';

const loadPlugin = async () => {
  if (!NativeBiometric && Capacitor.isNativePlatform()) {
    const mod = await import('capacitor-native-biometric');
    NativeBiometric = mod.NativeBiometric;
  }
  return NativeBiometric;
};

const SERVER = 'app.sigwallet.auth';

const normalizeAccountKey = (email: string) => email.trim().toLowerCase();

const getServerForEmail = (email: string) => `${SERVER}.${normalizeAccountKey(email)}`;

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

  const normalizedEmail = normalizeAccountKey(email);
  await plugin.setCredentials({
    username: normalizedEmail,
    password,
    server: getServerForEmail(normalizedEmail),
  });
  localStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
  localStorage.setItem(BIOMETRIC_ACCOUNT_KEY, normalizedEmail);
};

export const getBiometricAccount = (): string | null => {
  const account = localStorage.getItem(BIOMETRIC_ACCOUNT_KEY);
  return account ? normalizeAccountKey(account) : null;
};

export const getCredentials = async (email?: string): Promise<{ username: string; password: string } | null> => {
  try {
    const plugin = await loadPlugin();
    if (!plugin) return null;
    if (localStorage.getItem(BIOMETRIC_ENABLED_KEY) !== 'true') return null;

    const account = email ? normalizeAccountKey(email) : getBiometricAccount();
    if (!account) return null;
    
    // Prompt Face ID / Touch ID
    await plugin.verifyIdentity({
      reason: 'Mit Face ID anmelden',
      title: 'Anmelden',
    });
    
    // If verification passed, get stored credentials
    const creds = await plugin.getCredentials({ server: getServerForEmail(account) });
    return creds;
  } catch {
    return null;
  }
};

export const deleteCredentials = async (email?: string): Promise<void> => {
  try {
    const plugin = await loadPlugin();
    if (!plugin) return;

    const account = email ? normalizeAccountKey(email) : getBiometricAccount();
    if (account) {
      await plugin.deleteCredentials({ server: getServerForEmail(account) });
    }
  } catch {
    // ignore
  }

  const currentAccount = getBiometricAccount();
  if (!email || (currentAccount && currentAccount === normalizeAccountKey(email))) {
    localStorage.removeItem(BIOMETRIC_ENABLED_KEY);
    localStorage.removeItem(BIOMETRIC_ACCOUNT_KEY);
  }
};

export const isBiometricEnabled = (email?: string): boolean => {
  if (localStorage.getItem(BIOMETRIC_ENABLED_KEY) !== 'true') return false;

  const savedAccount = getBiometricAccount();
  if (!email) return Boolean(savedAccount);

  return savedAccount === normalizeAccountKey(email);
};
