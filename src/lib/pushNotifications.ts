import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';

export const initPushNotifications = async () => {
  if (!Capacitor.isNativePlatform()) return;

  const permResult = await PushNotifications.requestPermissions();
  if (permResult.receive !== 'granted') {
    console.log('Push notification permission denied');
    return;
  }

  await PushNotifications.register();

  PushNotifications.addListener('registration', async (token) => {
    console.log('Push token:', token.value);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Upsert token to push_tokens table
    await supabase.from('push_tokens').upsert(
      {
        user_id: user.id,
        token: token.value,
        platform: Capacitor.getPlatform(),
      },
      { onConflict: 'user_id,platform' }
    );
  });

  PushNotifications.addListener('registrationError', (err) => {
    console.error('Push registration error:', err);
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push received:', notification);
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('Push action:', action);
  });
};
