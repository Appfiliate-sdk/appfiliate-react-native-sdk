# Appfiliate React Native SDK

Lightweight install attribution for mobile app affiliate marketing.

## Installation

```bash
npm install appfiliate-react-native
# or
yarn add appfiliate-react-native
```

## Quick Start

```tsx
import { appfiliate } from 'appfiliate-react-native';

// Configure once on app start
appfiliate.configure({ appId: 'app_xxx', apiKey: 'key_xxx' });

// Track install (call once)
const result = await appfiliate.trackInstall();
console.log('Matched:', result.matched);
console.log('Confidence:', result.confidence);
```

## Track Purchases

```tsx
await appfiliate.trackPurchase({
  productId: 'premium_monthly',
  revenue: 9.99,
  currency: 'USD',
  transactionId: 'txn_123',
});
```

## Check Attribution

```tsx
const attributed = await appfiliate.isAttributed();
const id = await appfiliate.getAttributionId();
```

## How It Works

- **Android**: Reads Google Play Install Referrer (deterministic, ~95% accurate)
- **iOS**: Fingerprint matching via IP + device signals (~80-85% accurate)

## Requirements

- React Native 0.72+
- iOS 15+ / Android 5.0+

## License

MIT
