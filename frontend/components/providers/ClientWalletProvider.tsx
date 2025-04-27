import { ReactNode } from 'react';
import { WalletProvider } from '@mysten/dapp-kit';
import { ClientOnly } from '../ClientOnly';

// Wallet loading fallback component
const WalletLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[40px]">
    <div className="animate-pulse flex space-x-2">
      <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
      <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
      <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
    </div>
  </div>
);

interface ClientWalletProviderProps {
  children: ReactNode;
}

/**
 * Client-side only WalletProvider that prevents "localStorage is not defined" errors during SSR
 */
export function ClientWalletProvider({ children }: ClientWalletProviderProps) {
  return (
    <ClientOnly fallback={<WalletLoadingFallback />}>
      <WalletProvider
        autoConnect={true}
        preferredWallets={['Slush Wallet']}
        enableUnsafeBurner={false}
      >
        {children}
      </WalletProvider>
    </ClientOnly>
  );
}