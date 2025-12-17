import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import type { Device } from '@/types';
import { api } from '@/lib/api';

type NavigatePayload = { path: string };

function emitNavigate(path: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<NavigatePayload>('app:navigate', { detail: { path } })
  );
}

class NotificationService {
  private initialized = false;
  private pushEnabled = false;
  private isActive = true;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    if (!Capacitor.isNativePlatform()) return;

    // Track foreground/background
    try {
      const state = await App.getState();
      this.isActive = state.isActive;
    } catch {
      // ignore
    }

    App.addListener('appStateChange', (state) => {
      this.isActive = state.isActive;
    });

    // Local notification tap -> open device detail if deviceId provided
    LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (event) => {
        const deviceId =
          (event.notification?.extra as { deviceId?: string } | null)
            ?.deviceId ?? (event.notification?.extra as any)?.deviceId;
        if (deviceId) emitNavigate(`/device/${deviceId}`);
      }
    );

    // Push notification tap (killed/closed state supported by FCM)
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action) => {
        const deviceId =
          (action.notification?.data as { deviceId?: string } | null)
            ?.deviceId ?? (action.notification?.data as any)?.deviceId;
        if (deviceId) emitNavigate(`/device/${deviceId}`);
      }
    );
  }

  /**
   * Enable FCM push: request permission, register, and send token to backend.
   * Safe: never throws; never crashes app if permission denied.
   */
  async enablePushRegistration(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    if (this.pushEnabled) return;
    this.pushEnabled = true;

    try {
      const perm = await PushNotifications.requestPermissions();
      if (perm.receive !== 'granted') return;

      PushNotifications.addListener('registration', async (token) => {
        try {
          await api.registerPushToken({
            token: token.value,
            platform: 'android'
          });
        } catch {
          // ignore
        }
      });

      PushNotifications.addListener('registrationError', () => {
        // ignore
      });

      await PushNotifications.register();
    } catch {
      // ignore
    }
  }

  /**
   * Only notifies when app is not active (background). If permission denied, silently skips.
   */
  async notifyMotorChangeIfBackground(
    prev: Device,
    next: Device
  ): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    if (this.isActive) return;

    const prevState = prev.motorState;
    const nextState = next.motorState;
    if (!prevState || !nextState || prevState === nextState) return;

    const title = nextState === 'ON' ? 'Motor yoqildi' : "Motor o'chirildi";
    const body = `${next.name || 'Qurilma'}: ${title}`;

    try {
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== 'granted') return;

      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title,
            body,
            extra: { deviceId: next._id }
          }
        ]
      });
    } catch {
      // Never crash the app because of notifications
    }
  }
}

export const notificationService = new NotificationService();
