import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.b3eb565e41394a9ea27a48fe3bcb9762',
  appName: 'SigWallet',
  webDir: 'dist',
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#000000',
    },
    Keyboard: {
      resize: 'none',
      scrollPadding: false,
    },
  },
};

export default config;
