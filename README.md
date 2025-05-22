# Cathi DAO

## Overview
Cathi DAO is a decentralized donation and governance platform built on the Sui blockchain. Users can connect their Sui wallet, donate SUI tokens, and participate in governance proposals. The platform features a live 7-day countdown timer for campaign or voting windows.

**Tech Stack:**
- Next.js 14
- React 18
- TailwindCSS
- @mysten/dapp-kit (Sui wallet integration)
- TypeScript

## Features
- Sui wallet connection (devnet)
- Live 7-day countdown timer on homepage
- Donation and proposal voting UI
- Responsive, modern design with custom branding
- Treasury and wallet balance display
- Powered by Sui Blockchain

## Setup Instructions
1. **Clone the repo:**
   ```bash
   git clone <your-repo-url>
   cd Cathi-
   ```
2. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```
3. **Run the development server:**
   ```bash
   npm run dev
   ```
4. **Open in browser:**
   Visit [http://localhost:3000](http://localhost:3000)

## Environment Variables
No custom environment variables are required for devnet usage. For mainnet/testnet, see `frontend/constants.ts` and update as needed.

## 7-Day Countdown Timer
- The homepage displays a live countdown timer under the "Welcome to Cathi DAO" heading when the wallet is disconnected.
- The timer counts down from a fixed 7-day window, starting from a constant epoch (see `COUNTDOWN_START` in `DonationDaoClient.tsx`).
- The timer updates every second and cleans up on unmount.

## Logo & Branding
- The Cathi logo is displayed in the top left of the header and links to the homepage.
- Primary color: #2f6c8f (used for buttons, headings)
- Secondary color: #4e6a8a (used for text accents)

## Footer
```
Powered by Sui Blockchain
```

---

For questions or contributions, open an issue or pull request.
