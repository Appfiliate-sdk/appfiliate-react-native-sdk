import { NativeModules, Platform } from 'react-native';

const { AppfiliateModule } = NativeModules;

export interface AttributionResult {
  matched: boolean;
  attributionId: string | null;
  confidence: number;
  method: string;
  clickId: string | null;
}

class Appfiliate {
  private static appId: string | null = null;
  private static apiKey: string | null = null;
  private static apiBase = 'https://us-central1-appfiliate-5a18b.cloudfunctions.net/api';
  private static configured = false;
  private static SDK_VERSION = '1.0.0';

  /**
   * Configure Appfiliate with your app credentials.
   *
   * ```ts
   * import { appfiliate } from 'appfiliate-react-native';
   *
   * appfiliate.configure({ appId: 'app_xxx', apiKey: 'key_xxx' });
   * ```
   */
  static configure(opts: { appId: string; apiKey: string; apiBase?: string }) {
    this.appId = opts.appId;
    this.apiKey = opts.apiKey;
    if (opts.apiBase) this.apiBase = opts.apiBase;
    this.configured = true;
  }

  /**
   * Track install attribution. Call once on first app launch.
   *
   * ```ts
   * const result = await appfiliate.trackInstall();
   * console.log('Matched:', result.matched);
   * ```
   */
  static async trackInstall(): Promise<AttributionResult> {
    if (!this.configured) {
      throw new Error('Call appfiliate.configure() before trackInstall()');
    }

    // Check if already tracked
    const AsyncStorage = await this.getStorage();
    const tracked = await AsyncStorage.getItem('appfiliate_tracked');
    if (tracked === 'true') {
      return {
        matched: (await AsyncStorage.getItem('appfiliate_matched')) === 'true',
        attributionId: await AsyncStorage.getItem('appfiliate_attribution_id'),
        confidence: 0,
        method: 'cached',
        clickId: null,
      };
    }

    // Try to get Install Referrer on Android
    let referrer: string | null = null;
    if (Platform.OS === 'android' && AppfiliateModule?.getInstallReferrer) {
      try {
        referrer = await AppfiliateModule.getInstallReferrer();
      } catch {
        // Referrer not available
      }
    }

    const payload: Record<string, unknown> = {
      app_id: this.appId,
      platform: Platform.OS,
      os_version: Platform.Version?.toString() ?? 'unknown',
      sdk_version: this.SDK_VERSION,
    };

    if (referrer) {
      payload.referrer = referrer;
      const clickId = this.parseReferrerParam(referrer, 'af_click_id');
      if (clickId) payload.af_click_id = clickId;
    }

    try {
      const json = await this.post('/v1/attribution', payload);
      const result: AttributionResult = {
        matched: json.matched ?? false,
        attributionId: json.attribution_id ?? null,
        confidence: json.confidence ?? 0,
        method: json.method ?? 'unknown',
        clickId: json.click_id ?? null,
      };

      await AsyncStorage.setItem('appfiliate_tracked', 'true');
      await AsyncStorage.setItem(
        'appfiliate_matched',
        result.matched ? 'true' : 'false'
      );
      if (result.attributionId) {
        await AsyncStorage.setItem(
          'appfiliate_attribution_id',
          result.attributionId
        );
      }

      return result;
    } catch {
      return {
        matched: false,
        attributionId: null,
        confidence: 0,
        method: 'error',
        clickId: null,
      };
    }
  }

  /**
   * Track an in-app purchase.
   *
   * ```ts
   * await appfiliate.trackPurchase({
   *   productId: 'premium_monthly',
   *   revenue: 9.99,
   *   currency: 'USD',
   *   transactionId: 'txn_123',
   * });
   * ```
   */
  static async trackPurchase(opts: {
    productId: string;
    revenue: number;
    currency?: string;
    transactionId?: string;
  }): Promise<void> {
    if (!this.configured) {
      throw new Error('Call appfiliate.configure() before trackPurchase()');
    }

    const AsyncStorage = await this.getStorage();
    const attributionId = await AsyncStorage.getItem(
      'appfiliate_attribution_id'
    );
    if (!attributionId) return;

    const payload: Record<string, unknown> = {
      app_id: this.appId,
      attribution_id: attributionId,
      product_id: opts.productId,
      revenue: opts.revenue,
      currency: opts.currency ?? 'USD',
      sdk_version: this.SDK_VERSION,
    };
    if (opts.transactionId) payload.transaction_id = opts.transactionId;

    await this.post('/v1/purchases', payload);
  }

  /**
   * Check if this install was attributed.
   */
  static async isAttributed(): Promise<boolean> {
    const AsyncStorage = await this.getStorage();
    return (await AsyncStorage.getItem('appfiliate_matched')) === 'true';
  }

  /**
   * Get the attribution ID for this install.
   */
  static async getAttributionId(): Promise<string | null> {
    const AsyncStorage = await this.getStorage();
    return AsyncStorage.getItem('appfiliate_attribution_id');
  }

  // --- Private ---

  private static parseReferrerParam(
    referrer: string,
    key: string
  ): string | null {
    const params = referrer.split('&');
    for (const param of params) {
      const [k, v] = param.split('=');
      if (k === key) return v ?? null;
    }
    return null;
  }

  private static async getStorage() {
    // Use @react-native-async-storage if available, otherwise fallback
    try {
      const mod = require('@react-native-async-storage/async-storage');
      return mod.default;
    } catch {
      // Minimal fallback using a Map (data won't persist across restarts)
      const store = new Map<string, string>();
      return {
        getItem: async (key: string) => store.get(key) ?? null,
        setItem: async (key: string, value: string) => {
          store.set(key, value);
        },
      };
    }
  }

  private static async post(
    endpoint: string,
    payload: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const response = await fetch(`${this.apiBase}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey ?? '',
        'X-App-ID': this.appId ?? '',
      },
      body: JSON.stringify(payload),
    });
    return response.json();
  }
}

export const appfiliate = Appfiliate;
export default Appfiliate;
