import React, { useState, useEffect } from 'react';
import { 
  useCurrentAccount, 
  useSuiClient, 
  useSignAndExecuteTransaction
} from '@mysten/dapp-kit';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { MINIMUM_DONATION_AMOUNT, MINIMUM_DONATION_AMOUNT_SUI, PACKAGE_ID, TREASURY_ID } from '../constants';
import { useToast } from '@/components/ui/ToastNotification';
import { useVoter } from './BlockchainUtils';

interface DonationFormProps {
  onDonationComplete: () => void;
}

export const DonationForm: React.FC<DonationFormProps> = ({ 
  onDonationComplete 
}) => {
  const [amount, setAmount] = useState<string>(MINIMUM_DONATION_AMOUNT_SUI);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasVoterObject, setHasVoterObject] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<boolean>(false);
  const { showToast } = useToast();

  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecuteTransactionBlock } = useSignAndExecuteTransaction();
  const { checkVoterObject } = useVoter();

  // Check if the user already has a voter object
  const fetchVoterStatus = async () => {
    if (!currentAccount) return;
    
    try {
      const voter = await checkVoterObject(PACKAGE_ID);
      setHasVoterObject(!!voter);
    } catch (error) {
      console.error("Error checking voter status:", error);
      showToast('error', 'Failed to check voter status');
    }
  };

  useEffect(() => {
    if (currentAccount) {
      fetchVoterStatus();
    }
  }, [currentAccount]);

  // Validate donation amount
  useEffect(() => {
    const amountInMist = Math.floor(parseFloat(amount) * 10**9);
    setIsValid(
      !isNaN(amountInMist) && 
      amountInMist >= MINIMUM_DONATION_AMOUNT
    );
  }, [amount]);

  const handleDonate = async () => {
    if (!currentAccount) {
      showToast('error', "Please connect your wallet first");
      return;
    }

    if (!isValid) {
      showToast('error', `Minimum donation amount is ${MINIMUM_DONATION_AMOUNT_SUI} SUI`);
      return;
    }

    setIsLoading(true);

    try {
      // Convert SUI amount to MIST (1 SUI = 10^9 MIST)
      const amountInMist = Math.floor(parseFloat(amount) * 10**9);
      
      // Create a new transaction block
      const tx = new TransactionBlock();
      
      // Split coins from the user's wallet
      const [coin] = tx.splitCoins(tx.gas, [tx.pure(amountInMist)]);
      
      // Call the donate function from our Move module
      tx.moveCall({
        target: `${PACKAGE_ID}::donation_and_vote::donate`,
        arguments: [
          tx.object(TREASURY_ID),
          coin
        ],
      });
      
      // Create a voter object for the user if they don't already have one
      if (!hasVoterObject) {
        const voter = tx.moveCall({
          target: `${PACKAGE_ID}::donation_and_vote::create_voter`,
          arguments: [],
        });
        
        // Transfer the voter object to the sender
        tx.transferObjects([voter], tx.pure(currentAccount.address));
      }

      // Sign and execute the transaction
      const response = await signAndExecuteTransactionBlock({
        transaction: tx as any
      });

      if (response && response.digest) {
        setHasVoterObject(true);
        showToast('success', 'Thank you! Your donation was successful. You now have voting rights.');
        onDonationComplete();
        setAmount(MINIMUM_DONATION_AMOUNT_SUI);
      }
    } catch (error: any) {
      console.error("Donation error:", error);
      showToast('error', `Donation failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-[#4e6a8a]">Make a Donation</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-[#4e6a8a] mb-1">
          Amount (SUI)
        </label>
        <div className="relative">
          <input
            type="number"
            min={MINIMUM_DONATION_AMOUNT_SUI}
            step="0.001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#2f6c8f] text-[#4e6a8a]
              ${!isValid && amount !== MINIMUM_DONATION_AMOUNT_SUI ? 'border-red-300' : 'border-gray-300'}`}
            disabled={isLoading}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-[#4e6a8a]">SUI</span>
          </div>
        </div>
        <p className="mt-1 text-sm text-[#4e6a8a]">
          Minimum donation: {MINIMUM_DONATION_AMOUNT_SUI} SUI. Each donation grants 1 voting right regardless of amount.
        </p>
      </div>
      
      <button
        onClick={handleDonate}
        disabled={isLoading || !isValid || !currentAccount}
        className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors duration-200
          ${isLoading || !isValid || !currentAccount
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-[#2f6c8f] hover:bg-[#4e6a8a]'}`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            <span>Processing...</span>
          </div>
        ) : 'Donate SUI'}
      </button>
      
      {hasVoterObject && (
        <div className="mt-4 p-3 bg-white border border-[#2f6c8f] text-[#4e6a8a] rounded-md">
          <p className="text-sm">You are eligible to vote on proposals.</p>
        </div>
      )}
    </div>
  );
};