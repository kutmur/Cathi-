'use client';
import { PropsWithChildren } from 'react';
import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui.js/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NETWORK } from '../constants';
import { ToastProvider } from './ui/ToastNotification';

// Create a React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Create network configuration
const { networkConfig } = createNetworkConfig({
  devnet: { url: getFullnodeUrl('devnet') },
  mainnet: { url: getFullnodeUrl('mainnet') }
});

export default function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork={NETWORK || "devnet"}>
        <WalletProvider 
          autoConnect={true}
          enableUnsafeBurner={false}
          preferredWallets={['Sui Wallet', 'Ethos Wallet', 'Slush Wallet']}
          storageKey="cathi-dao-wallet-preference"
        >
          <ToastProvider>
            {children}
          </ToastProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}