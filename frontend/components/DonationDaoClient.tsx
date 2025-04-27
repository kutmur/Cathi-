import { useEffect, useState, useCallback } from 'react';
import { useCurrentAccount, useCurrentWallet, ConnectButton } from '@mysten/dapp-kit';
import { DonationForm } from './DonationForm';
import { ProposalsList } from './ProposalsList';
import { useWalletBalance } from './BlockchainUtils';
import { formatAddress } from '../constants';
import { useToast } from '@/components/ui/ToastNotification';
import ClientOnly from './ClientOnly';
import Link from 'next/link';
import Image from 'next/image';
import { TreasuryBalance } from './TreasuryBalance';

// CountdownTimer component
const COUNTDOWN_START = 1715731200000; // Example: fixed epoch (replace with your chosen epoch)
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
function CountdownTimer() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  const end = COUNTDOWN_START + SEVEN_DAYS_MS;
  const diff = Math.max(0, end - now);
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((diff % (60 * 1000)) / 1000);
  return (
    <div className="flex justify-center mt-4">
      <div className="bg-white rounded-lg shadow px-6 py-2 flex space-x-4 text-primary text-lg font-semibold border border-gray-200">
        <span>{days}d</span>
        <span>:</span>
        <span>{hours.toString().padStart(2, '0')}h</span>
        <span>:</span>
        <span>{minutes.toString().padStart(2, '0')}m</span>
        <span>:</span>
        <span>{seconds.toString().padStart(2, '0')}s</span>
      </div>
    </div>
  );
}

export const DonationDaoClient = () => {
  const [walletBalance, setWalletBalance] = useState<string>("0");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const currentAccount = useCurrentAccount();
  const { connectionStatus, currentWallet } = useCurrentWallet();
  const { showToast } = useToast();
  
  const { getWalletBalance } = useWalletBalance();
  
  const fetchWalletBalance = useCallback(async () => {
    if (!currentAccount) return;
    
    try {
      const balance = await getWalletBalance();
      setWalletBalance(balance);
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      showToast('error', "Failed to fetch wallet balance");
    }
  }, [currentAccount, getWalletBalance, showToast]);

  useEffect(() => {
    if (currentAccount) {
      fetchWalletBalance();
      const intervalId = setInterval(fetchWalletBalance, 15000);
      return () => clearInterval(intervalId);
    }
  }, [currentAccount, fetchWalletBalance]);

  useEffect(() => {
    if (connectionStatus === 'connected' && currentAccount) {
      fetchWalletBalance();
      setConnectionError(null);
    } else if (connectionStatus === 'disconnected') {
      setConnectionError('Wallet disconnected. Please connect your wallet to continue.');
    } else if (connectionStatus === 'connecting') {
      setConnectionError(null);
    }
  }, [connectionStatus, currentAccount, fetchWalletBalance]);

  const handleActionComplete = () => {
    fetchWalletBalance();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-white shadow-sm w-full">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center w-full sm:w-auto justify-between">
            <Link href="/" className="flex items-center">
              <Image src="/logo.jpeg" alt="Cathi Logo" width={240} height={80} style={{height:80, width:'auto'}} priority />
            </Link>
            <span className="sm:hidden ml-2 text-2xl font-bold text-primary">Cathi DAO</span>
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <TreasuryBalance />
            {currentAccount && (
              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                <p className="text-sm text-secondary">
                  Balance: <span className="font-semibold">{walletBalance} SUI</span>
                </p>
                <p className="text-xs mt-1 text-secondary">
                  {formatAddress(currentAccount.address)}
                </p>
              </div>
            )}
            <ConnectButton className="bg-primary hover:bg-[#265877] text-white font-semibold px-4 py-2 rounded shadow transition-colors" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1 w-full">
        {connectionStatus === 'connecting' ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4 border-primary"></div>
            <h2 className="text-3xl font-bold mb-4 text-secondary">Connecting to wallet...</h2>
            <p className="text-lg max-w-lg mx-auto mb-8 text-secondary">
              Please approve the connection in your wallet extension.
            </p>
          </div>
        ) : connectionStatus === 'disconnected' ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-3xl font-bold mb-4 text-secondary">Welcome to Cathi DAO</h2>
            <CountdownTimer />
            <p className="text-lg max-w-lg mx-auto mb-8 text-secondary mt-6">
              Connect your wallet to donate SUI and participate in governance proposals.
            </p>
            <ClientOnly>
              <ConnectButton className="bg-primary hover:bg-[#265877] text-white font-semibold px-6 py-2 rounded shadow transition-colors" />
            </ClientOnly>
          </div>
        ) : currentAccount ? (
          <div className="max-w-3xl mx-auto space-y-8">
            <DonationForm onDonationComplete={handleActionComplete} />
            <ProposalsList onVoteComplete={handleActionComplete} />
          </div>
        ) : null}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-sm text-gray-500">
            Powered by Sui Blockchain
          </p>
        </div>
      </footer>
    </div>
  );
};