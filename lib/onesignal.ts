declare global {
  interface Window {
    OneSignal: OneSignalType;
    OneSignalProxy?: unknown;
  }
}

interface OneSignalType {
  init: (options: {
    appId: string;
    safari_web_id?: string;
    allowLocalhostAsSecureOrigin?: boolean;
    autoRegister?: boolean;
    notifyButton?: {
      enable?: boolean;
    };
    promptOptions?: {
      slidedown?: {
        enabled?: boolean;
        autoPrompt?: boolean;
        actionMessage?: string;
        acceptButton?: string;
        cancelButton?: string;
      };
    };
  }) => void;
  showSlidedownPrompt: () => Promise<void>;
  showNativePrompt: () => Promise<void>;
  getNotificationPermission: () => Promise<NotificationPermission>;
  setNotificationPermission: (permission: NotificationPermission) => void;
  isPushNotificationsEnabled: () => Promise<boolean>;
  registerForPushNotifications: () => Promise<void>;
  getUserId: () => Promise<string | undefined>;
  sendTag: (key: string, value: string) => Promise<object>;
  sendTags: (tags: Record<string, string>) => Promise<object>;
  deleteTag: (key: string) => Promise<object>;
  getTags: () => Promise<Record<string, string>>;
  addListenerForNotificationOpened: (callback: (notification: unknown) => void) => void;
  setExternalUserId: (externalId: string) => Promise<void>;
  removeExternalUserId: () => Promise<void>;
  on: (event: string, callback: (data: unknown) => void) => void;
  off: (event: string, callback: (data: unknown) => void) => void;
}

class OneSignalService {
  private isInitialized = false;
  private appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '';
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (this.isInitialized) return;

    if (!this.appId) {
      console.log('[OneSignal] App ID not configured');
      return;
    }

    if (window.OneSignal) {
      this.isInitialized = true;
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.loadScript();
    return this.initPromise;
  }

  private async loadScript(): Promise<void> {
    return new Promise((resolve) => {
      if (window.OneSignal) {
        this.setupOneSignal();
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.onesignal.com/sdks/OneSignalSDK.js';
      script.async = true;
      script.onload = () => {
        this.setupOneSignal();
        resolve();
      };
      script.onerror = (error) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[OneSignal] Failed to load SDK in development. This is normal if you have an ad-blocker or are not using HTTPS.', error);
        } else {
          console.error('[OneSignal] Failed to load SDK:', error);
        }
        resolve();
      };

      let attempts = 0;
      const maxAttempts = 3;
      const tryInit = () => {
        attempts++;
        if (window.OneSignal) {
          this.setupOneSignal();
          resolve();
        } else if (attempts < maxAttempts) {
          setTimeout(tryInit, 1000);
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[OneSignal] Initialization skipped in development after', maxAttempts, 'attempts.');
          } else {
            console.error('[OneSignal] Failed to initialize after', maxAttempts, 'attempts');
          }
          resolve();
        }
      };

      document.head.appendChild(script);

      setTimeout(tryInit, 2000);
    });
  }

  private setupOneSignal(): void {
    if (!window.OneSignal || this.isInitialized) return;

    try {
      window.OneSignal.init({
        appId: this.appId,
        allowLocalhostAsSecureOrigin: true,
        autoRegister: false,
        notifyButton: {
          enable: false,
        },
        promptOptions: {
          slidedown: {
            enabled: true,
            autoPrompt: false,
            actionMessage: 'Halo! Aktifkan notifikasi untuk mendapatkan pengingat minum TTD setiap hari.',
            acceptButton: 'Aktifkan',
            cancelButton: 'Nanti saja',
          },
        },
      });

      window.OneSignal.on('subscriptionChange', (isSubscribed: unknown) => {
        console.log('[OneSignal] Subscription changed:', isSubscribed);
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('[OneSignal] Setup error:', error);
    }
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    await this.init();

    if (!window.OneSignal) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[OneSignal] SDK not loaded. Notification permission request skipped in development.');
      } else {
        console.error('[OneSignal] SDK not loaded');
      }
      return false;
    }

    const permission = await window.OneSignal.getNotificationPermission();
    if (permission === 'granted') {
      await window.OneSignal.registerForPushNotifications();
      return true;
    }

    try {
      await window.OneSignal.showNativePrompt();
      const newPermission = await window.OneSignal.getNotificationPermission();
      if (newPermission === 'granted') {
        await window.OneSignal.registerForPushNotifications();
        return true;
      }
    } catch (error) {
      console.error('[OneSignal] Error requesting permission:', error);
    }

    return false;
  }

  async isSubscribed(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.OneSignal) return false;
    return window.OneSignal.isPushNotificationsEnabled();
  }

  async getUserId(): Promise<string | undefined> {
    if (typeof window === 'undefined' || !window.OneSignal) return undefined;
    return window.OneSignal.getUserId();
  }

  async setExternalUserId(userId: string): Promise<void> {
    if (typeof window === 'undefined' || !window.OneSignal) return;
    return window.OneSignal.setExternalUserId(userId);
  }

  async removeExternalUserId(): Promise<void> {
    if (typeof window === 'undefined' || !window.OneSignal) return;
    await window.OneSignal.removeExternalUserId();
  }

  async sendTag(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined' || !window.OneSignal) return;
    await window.OneSignal.sendTag(key, value);
  }

  async sendTags(tags: Record<string, string>): Promise<void> {
    if (typeof window === 'undefined' || !window.OneSignal) return;
    await window.OneSignal.sendTags(tags);
  }

  onNotificationOpened(callback: (notification: unknown) => void): void {
    if (typeof window === 'undefined' || !window.OneSignal) return;
    window.OneSignal.addListenerForNotificationOpened(callback);
  }
}

export const oneSignalService = new OneSignalService();
export default oneSignalService;