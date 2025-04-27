export const isSuiWalletInstalled = () =>
  typeof window !== 'undefined' &&
  !!(window as any).sui?.wallet?.request;    // true for Sui Wallet & Slush