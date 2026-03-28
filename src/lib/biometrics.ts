import { Capacitor } from '@capacitor/core';

let BiometricAuth: any = null;

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_ACCOUNT_KEY = 'biometric_account';
const CREDENTIALS_PREFIX = 'bio_creds_';

const loadPlugin = async () => {
  if (!BiometricAuth && Capacitor.isNativePlatform()) {
    const mod = await import('@aparajita/capacitor-biometric-auth');
    BiometricAuth = mod.BiometricAuth;
  }
  return BiometricAuth;
};

const normalizeAccountKey = (email: string) => email.trim().toLowerCase();

export const isBiometricAvailable = async (): Promise<boolean> => {
  try {
    const plugin = await loadPlugin();
    if (!plugin) return false;
    const result = await plugin.checkBiometry();
    return result.isAvailable;
  } catch {
    return false;
  }
};

export const saveCredentials = async (email: string, password: string): Promise<void> => {
  const normalizedEmail = normalizeAccountKey(email);
  // Store credentials in localStorage (encrypted in native keychain would be ideal,
  // but this plugin doesn't have credential storage - we use biometric gate instead)
  const encoded = btoa(JSON.stringify({ username: normalizedEmail, password }));
  localStorage.setItem(`${CREDENTIALS_PREFIX}${normalizedEmail}`, encoded);
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

    const stored = localStorage.getItem(`${CREDENTIALS_PREFIX}${account}`);
    if (!stored) return null;

    // Prompt Face ID / Touch ID
    await plugin.authenticate({
      reason: 'Mit Face ID anmelden',
      cancelTitle: 'Abbrechen',
      allowDeviceCredential: false,
    });

    // If verification passed, return stored credentials
    const creds = JSON.parse(atob(stored));
    return creds;
  } catch {
    return null;
  }
};

export const deleteCredentials = async (email?: string): Promise<void> => {
  const account = email ? normalizeAccountKey(email) : getBiometricAccount();
  if (account) {
    localStorage.removeItem(`${CREDENTIALS_PREFIX}${account}`);
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
