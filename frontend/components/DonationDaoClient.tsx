import { useEffect, useState, useCallback } from 'react';
import { useCurrentAccount, useCurrentWallet, ConnectButton } from '@mysten/dapp-kit';
import { DonationForm } from './DonationForm';
import { ProposalsList } from './ProposalsList';
import { useWalletBalance, useTreasury } from './BlockchainUtils';
import { TREASURY_ID, formatAddress } from '../constants';
import { useToast } from '@/components/ui/ToastNotification';
import ConnectWalletButton from './ConnectWalletButton';
import ClientOnly from './ClientOnly';

export const DonationDaoClient = () => {
  const [treasuryBalance, setTreasuryBalance] = useState<string>("0");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [walletBalance, setWalletBalance] = useState<string>("0");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const currentAccount = useCurrentAccount();
  const { connectionStatus, currentWallet } = useCurrentWallet();
  const { showToast } = useToast();
  
  const { getWalletBalance } = useWalletBalance();
  const { getTreasuryBalance } = useTreasury();
  
  const fetchTreasuryBalance = useCallback(async () => {
    setIsLoading(true);
    try {
      const balance = await getTreasuryBalance(TREASURY_ID);
      setTreasuryBalance(balance);
    } catch (error) {
      console.error("Error fetching treasury balance:", error);
      showToast('error', "Failed to fetch treasury balance");
    } finally {
      setIsLoading(false);
    }
  }, [getTreasuryBalance, showToast]);

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
    fetchTreasuryBalance();
    const intervalId = setInterval(fetchTreasuryBalance, 15000);
    return () => clearInterval(intervalId);
  }, [fetchTreasuryBalance]);

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
    fetchTreasuryBalance();
    fetchWalletBalance();
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-[#2f6c8f]">Cathi DAO</h1>
            <div className="flex items-center space-x-4">
              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-sm font-medium text-[#4e6a8a] mb-1">Treasury Balance</h2>
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2 border-[#2f6c8f]"></div>
                    <span className="text-[#4e6a8a]">Loading...</span>
                  </div>
                ) : (
                  <p className="text-xl font-bold text-[#2f6c8f]">{treasuryBalance} SUI</p>
                )}
              </div>
              {currentAccount && (
                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                  <p className="text-sm text-[#4e6a8a]">
                    Balance: <span className="font-semibold">{walletBalance} SUI</span>
                  </p>
                  <p className="text-xs mt-1 text-[#4e6a8a]">
                    {formatAddress(currentAccount.address)}
                  </p>
                </div>
              )}
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {connectionStatus === 'connecting' ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4 border-[#2f6c8f]"></div>
            <h2 className="text-2xl font-bold mb-4 text-[#4e6a8a]">Connecting to wallet...</h2>
            <p className="text-lg max-w-lg mx-auto mb-8 text-[#4e6a8a]">
              Please approve the connection in your wallet extension.
            </p>
          </div>
        ) : connectionStatus === 'disconnected' ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold mb-4 text-[#4e6a8a]">Welcome to Cathi DAO</h2>
            <p className="text-lg max-w-lg mx-auto mb-8 text-[#4e6a8a]">
              Connect your wallet to donate SUI and participate in governance proposals.
            </p>
            <ClientOnly>
              <ConnectWalletButton />
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