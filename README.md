# Appfiliate React Native SDK

Creator attribution SDK for mobile app affiliate marketing. Track which creators, influencers, and campaigns drive installs and revenue for your React Native app. Pure JavaScript/TypeScript — no native modules required.

**[Website](https://appfiliate.io)** | **[Documentation](https://docs.appfiliate.io)** | **[Blog](https://appfiliate.io/blog)** | **[Sign Up Free](https://app.appfiliate.io/signup)**

## Installation

```bash
npm install appfiliate-react-native @react-native-async-storage/async-storage
```

AsyncStorage is a peer dependency used for persisting attribution state across app launches.

## Quick Start

```tsx
import { appfiliate } from 'appfiliate-react-native';

// 1. Configure once on app startup
appfiliate.configure({ appId: 'APP_ID_HERE', apiKey: 'API_KEY_HERE' });

// 2. Track install (safe to call every launch -- only runs once)
const result = await appfiliate.trackInstall();
console.log('Attributed:', result.matched);
```

Your `appId` and `apiKey` are available in your [Appfiliate dashboard](https://app.appfiliate.io).

## Track Purchases

Call after every successful in-app purchase:

```tsx
await appfiliate.trackPurchase({
  productId: 'premium_monthly',
  revenue: 9.99,
  currency: 'USD',
  transactionId: 'txn_123',
});
```

## Link a User ID

If you use RevenueCat or another subscription platform, link the user ID so server-side webhooks can attribute purchases automatically:

```tsx
await appfiliate.setUserId(Purchases.appUserID);
```

## Check Attribution

Synchronous getters are available after `trackInstall()` completes:

```tsx
appfiliate.isAttributed;  // boolean
appfiliate.attributionId; // string | null
```

## API Reference

### `appfiliate.configure(opts)`

| Parameter | Type     | Required | Description                     |
|-----------|----------|----------|---------------------------------|
| appId     | string   | Yes      | Your app ID from the dashboard  |
| apiKey    | string   | Yes      | Your API key from the dashboard |

### `appfiliate.trackInstall()`

Returns `Promise<AttributionResult>`:

```ts
interface AttributionResult {
  matched: boolean;
  attributionId: string | null;
  confidence: number;
  method: string;
  clickId: string | null;
}
```

### `appfiliate.trackPurchase(opts)`

| Parameter     | Type   | Required | Default | Description           |
|---------------|--------|----------|---------|-----------------------|
| productId     | string | Yes      |         | Product identifier    |
| revenue       | number | Yes      |         | Purchase amount       |
| currency      | string | No       | "USD"   | ISO 4217 currency     |
| transactionId | string | No       |         | Platform transaction  |

### `appfiliate.setUserId(userId: string)`

Links an external user ID to the attribution.

### `appfiliate.isAttributed`

`boolean` -- whether this install was attributed to a creator.

### `appfiliate.attributionId`

`string | null` -- the attribution ID, or null if not attributed.

## How It Works

The SDK collects non-identifying device signals (screen size, timezone, language, OS version) and sends them to the Appfiliate API for probabilistic fingerprint matching against recent link clicks. No IDFA, no ATT prompt, no native modules.

## Requirements

- React Native 0.72+
- iOS 15+ / Android 5.0+

## Resources

- [Getting started guide](https://docs.appfiliate.io/quick-start)
- [How to set up an affiliate program for your app](https://appfiliate.io/blog/how-to-set-up-affiliate-program-mobile-app)
- [Appfiliate vs AppsFlyer vs Branch](https://appfiliate.io/blog/appfiliate-vs-appsflyer-vs-branch)
- [What is a creator attribution SDK?](https://appfiliate.io/blog/creator-attribution-sdk)
- [How attribution works without IDFA](https://appfiliate.io/blog/mobile-app-install-attribution-without-idfa)

## License

MIT
