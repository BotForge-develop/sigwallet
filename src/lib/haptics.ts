import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const hapticLight = async () => {
  if (!Capacitor.isNativePlatform()) return;
  await Haptics.impact({ style: ImpactStyle.Light });
};

export const hapticMedium = async () => {
  if (!Capacitor.isNativePlatform()) return;
  await Haptics.impact({ style: ImpactStyle.Medium });
};

export const hapticHeavy = async () => {
  if (!Capacitor.isNativePlatform()) return;
  await Haptics.impact({ style: ImpactStyle.Heavy });
};

export const hapticSuccess = async () => {
  if (!Capacitor.isNativePlatform()) return;
  await Haptics.notification({ type: NotificationType.Success });
};

export const hapticError = async () => {
  if (!Capacitor.isNativePlatform()) return;
  await Haptics.notification({ type: NotificationType.Error });
};
