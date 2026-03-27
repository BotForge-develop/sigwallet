import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.b3eb565e41394a9ea27a48fe3bcb9762',
  appName: 'SigWallet',
  webDir: 'dist',
  server: {
    url: 'https://b3eb565e-4139-4a9e-a27a-48fe3bcb9762.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#000000',
    },
  },
};

export default config;
