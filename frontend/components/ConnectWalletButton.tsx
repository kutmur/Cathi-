'use client';
import { useCurrentAccount, useCurrentWallet, ConnectButton } from '@mysten/dapp-kit';
import { isSuiWalletInstalled } from '../lib/wallet';

const primary = '#2f6c8f';
const textCol = '#4e6a8a';

export default function ConnectWalletButton() {
  const { connectionStatus } = useCurrentWallet();
  const currentAccount = useCurrentAccount();

  if (!isSuiWalletInstalled())
    return <p className="text-red-500 font-medium">Please install a Sui Wallet browser extension.</p>;

  if (connectionStatus === 'connecting')
    return (
      <button
        className="rounded px-6 py-2 opacity-60 bg-[#2f6c8f] text-white"
        disabled
      >
        Connecting…
      </button>
    );

  return (
    <ConnectButton 
      connectText={currentAccount ? 
        `${currentAccount.address.slice(0, 6)}…${currentAccount.address.slice(-4)}` : 
        "Connect Wallet"}
      className="w-auto bg-[#2f6c8f] text-white px-6 py-2 rounded hover:bg-[#4e6a8a] transition-colors duration-200"
    />
  );
}