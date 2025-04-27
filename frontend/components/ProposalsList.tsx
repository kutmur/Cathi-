import React, { useEffect, useState } from 'react';
import { 
  useCurrentAccount, 
  useSuiClient, 
  useSignAndExecuteTransaction,
} from '@mysten/dapp-kit';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { useToast } from '@/components/ui/ToastNotification';
import { PACKAGE_ID, TREASURY_ID } from '../constants';
import { useVoter } from './BlockchainUtils';

// Updated interface to match what comes from the blockchain
interface BlockchainProposal {
  id: string;
  title: string;
  vote_count: number;
  active: boolean;
}

// Interface for our UI display
interface Proposal {
  id: string;
  title: string;
  image: string;
  votes: number;
}

interface VoterObject {
  id: string;
  hasVoted: boolean;
}

interface ProposalsListProps {
  onVoteComplete?: () => void;
}

const ProposalsList = ({ onVoteComplete }: ProposalsListProps) => {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransactionBlock } = useSignAndExecuteTransaction();
  const { showToast } = useToast();
  const [proposals] = useState<Proposal[]>([
    { id: 'koza', title: 'Koza DAO', image: '/images/koza.jpeg', votes: 0 },
    { id: 'kurtaranEv', title: 'Kurtaran Ev', image: '/images/kurtaranEv.jpeg', votes: 0 },
  ]);
  const [votedProposals, setVotedProposals] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [voterObject, setVoterObject] = useState<VoterObject | null>(null);
  const { checkVoterObject } = useVoter();
  
  const suiClient = useSuiClient();

  useEffect(() => {
    // Load voted proposals from localStorage
    const savedVotes = localStorage.getItem('votedProposals');
    if (savedVotes) {
      setVotedProposals(JSON.parse(savedVotes));
    }
  }, []);

  // Check the user's voter object status
  const fetchVoterStatus = async () => {
    if (!currentAccount) return;

    try {
      const voter = await checkVoterObject(PACKAGE_ID);
      setVoterObject(voter);
    } catch (error) {
      console.error("Error checking voter status:", error);
      showToast('error', "Error checking voter status");
    }
  };
  
  // Check voter status on component mount
  useEffect(() => {
    if (currentAccount) {
      fetchVoterStatus();
    }
  }, [currentAccount]);

  const handleVote = async (proposalId: string) => {
    if (!currentAccount?.address) {
      showToast('error', 'Please connect your wallet first');
      return;
    }

    if (!voterObject) {
      showToast('error', 'You need to make a minimum donation to vote');
      return;
    }

    if (votedProposals.includes(proposalId)) {
      showToast('error', 'You have already voted for this proposal');
      return;
    }

    setIsLoading(true);

    try {
      const tx = new TransactionBlock();
      
      // Get the gas object first
      const gas = tx.gas;
      
      // Split coins with proper BigInt
      const [coin] = tx.splitCoins(gas, [BigInt(1_000_000)]);
      
      // Call the vote function
      tx.moveCall({
        target: `${PACKAGE_ID}::donation_and_vote::vote`,
        arguments: [
          tx.object(TREASURY_ID),
          tx.pure(proposalId),
          coin
        ],
      });

      const response = await signAndExecuteTransactionBlock({
        transaction: tx.serialize()
      });

      if (response && response.digest) {
        const newVotedProposals = [...votedProposals, proposalId];
        setVotedProposals(newVotedProposals);
        localStorage.setItem('votedProposals', JSON.stringify(newVotedProposals));

        showToast('success', 'Vote cast successfully');
        if (onVoteComplete) {
          onVoteComplete();
        }
      }
    } catch (error: any) {
      console.error('Error voting:', error);
      showToast('error', `Voting failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
      {proposals.map((proposal) => (
        <div 
          key={proposal.id}
          className="bg-white rounded-lg shadow-lg overflow-hidden"
        >
          <img 
            src={proposal.image} 
            alt={proposal.title}
            className="w-full h-48 object-cover bg-gray-100"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/images/placeholder.jpeg';
            }}
          />
          <div className="p-4">
            <h3 className="text-xl font-semibold text-[#4e6a8a] mb-2">
              {proposal.title}
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-[#4e6a8a]">
                {proposal.votes} votes
              </span>
              <button
                onClick={() => handleVote(proposal.id)}
                disabled={votedProposals.includes(proposal.id) || isLoading || !voterObject}
                className={`px-4 py-2 rounded-md ${
                  votedProposals.includes(proposal.id) || isLoading || !voterObject
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-[#2f6c8f] hover:bg-[#4e6a8a] text-white'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span>Voting...</span>
                  </div>
                ) : votedProposals.includes(proposal.id) ? 'Voted' : 'Vote'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProposalsList;