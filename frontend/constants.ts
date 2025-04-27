// Project-wide constants

// Network to use
export const NETWORK = 'devnet';

// Package ID for the donation module (update with your deployed package ID)
export const PACKAGE_ID = '0xbe336cfda15b7655467db977db0d47892d4bb2fcd83c43453c2ae2acd9855da9';

// Treasury ID (update with your deployed treasury object ID)
export const TREASURY_ID = '0x5ce28668f7172dc0d544a274f57a41682ae86b0833329c6d2ae0a922d0a60468';

// Faucet URL for devnet
export const FAUCET_URL = 'https://faucet.devnet.sui.io/gas';

// Explorer URL
export const EXPLORER_URL = `https://suiexplorer.com/txblock/`;

// Minimum donation amount in MIST (0.001 SUI = 1,000,000 MIST)
export const MINIMUM_DONATION_AMOUNT = 1_000_000;

// Minimum donation amount in SUI for display
export const MINIMUM_DONATION_AMOUNT_SUI = '0.001';

/**
 * Format SUI with proper decimals
 * @param valueInMIST The amount in MIST units
 * @returns Formatted SUI amount with 4 decimal places
 */
export const formatSUI = (valueInMIST: string | number): string => {
  try {
    const value = typeof valueInMIST === 'string' ? BigInt(valueInMIST) : BigInt(valueInMIST.toString());
    return (Number(value) / 10**9).toFixed(4);
  } catch (error) {
    console.error("Error formatting SUI amount:", error);
    return "0.0000";
  }
};

/**
 * Format address for display with truncation
 * @param address The full blockchain address
 * @returns Shortened version for display
 */
export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};