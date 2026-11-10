# Intern Wallet

Intern Wallet is a simple personal finance app for interns. It helps track income, expenses, budgets, and daily spending while keeping data locally on the device.

<p align="center">
  <img src="./assets/mobile-mockup.png" alt="Intern Wallet mobile app mockup" width="100%" />
</p>

## Features

- Add, edit, repeat, search, filter, and sort income and expense transactions
- Organize transactions with built-in or custom income and expense categories
- See balances, monthly summaries, recent activity, and internship progress at a glance
- Set overall monthly budgets and category limits with live spending progress
- Calculate a safe daily spending amount from the available balance and remaining internship days
- Review daily spending history and see which days stayed within the daily limit
- Explore reports for cash flow, spending trends, category breakdowns, income sources, budget performance, and financial insights
- Personalize a local profile, currency display, and date format
- Export transactions as CSV and create, preview, and restore validated JSON backups
- Keep financial data private and available offline with on-device SQLite storage

## Tech Stack

- Expo and React Native
- TypeScript
- Expo Router
- SQLite
- Zustand and Zod

## Getting Started

```bash
npm install
npm start
```

Use the Expo terminal menu to open the app on Android, iOS, or the web.

### Test on an Android phone

1. Install [Expo Go](https://expo.dev/go) on the phone.
2. Connect the phone and development computer to the same Wi-Fi network.
3. Run `npm start` and scan the displayed QR code with Expo Go.

If the phone cannot connect over the local network, start Expo in tunnel mode:

```bash
npx expo start --tunnel
```

On Windows PowerShell, use `npm.cmd` and `npx.cmd` if script execution is disabled:

```powershell
npm.cmd start
npx.cmd expo start --tunnel
```

### Build an installable Android APK

The `preview` profile in `eas.json` produces an APK for direct installation on an Android device:

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

When the build finishes, open the EAS download link on the Android device and install the APK. The Android application ID is `com.yeminaung.internwallet`.

## Checks

```bash
npm test
npx tsc --noEmit
```
