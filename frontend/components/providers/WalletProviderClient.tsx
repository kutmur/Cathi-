import { ReactNode } from 'react';
import { 
  SuiClientProvider, 
  WalletProvider,
  createNetworkConfig,
  type WalletProviderProps
} from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui.js/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientOnly } from '../ClientOnly';
import { NETWORK } from '../../constants';

// Create React Query client with proper configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Define network configuration using createNetworkConfig
const networkConfig = createNetworkConfig({
  devnet: { url: getFullnodeUrl('devnet') },
  mainnet: { url: getFullnodeUrl('mainnet') }
});

// Configure wallet options specifically for development environments
const getWalletProviderProps = (): WalletProviderProps => {
  // Common configuration for all environments
  const config: WalletProviderProps = {
    autoConnect: false,
    preferredWallets: ['Sui Wallet', 'Ethos Wallet', 'Slush Wallet', 'Suiet Wallet'],
    enableUnsafeBurner: false,
    // Configure secure context check to be bypassed in development (localhost)
    // This allows wallet connections even on http://localhost
    walletAdapters: []
  };

  // Add development-specific configuration for localhost
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    config.localDevWalletConfig = {
      // Allow HTTP localhost connections (insecure contexts)
      allowInsecureLocalhost: true
    };
  }

  return config;
};

// Wallet loading fallback component
const WalletLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[40px]">
    <div className="animate-pulse flex space-x-2">
      <div className="h-2 w-2 bg-[#2f6c8f] rounded-full"></div>
      <div className="h-2 w-2 bg-[#2f6c8f] rounded-full"></div>
      <div className="h-2 w-2 bg-[#2f6c8f] rounded-full"></div>
    </div>
  </div>
);

interface WalletProviderClientProps {
  children: ReactNode;
}

export function WalletProviderClient({ children }: WalletProviderClientProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig.networkConfig} defaultNetwork={NETWORK}>
        <ClientOnly fallback={<WalletLoadingFallback />}>
          <WalletProvider
            {...getWalletProviderProps()}
          >
            {children}
          </WalletProvider>
        </ClientOnly>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}