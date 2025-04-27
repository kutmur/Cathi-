import React, { useEffect, useState } from 'react';
import { 
  useCurrentAccount, 
  useSuiClient, 
  useSignAndExecuteTransaction 
} from '@mysten/dapp-kit';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { useToast } from '@/components/ui/ToastNotification';
import { PACKAGE_ID } from '../constants';
import { useVoter, useProposals } from './BlockchainUtils';

interface Proposal {
  id: string;
  title: string;
  vote_count: number;
  active: boolean;
}

interface VoterObject {
  id: string;
  hasVoted: boolean;
}

interface ProposalsListProps {
  onVoteComplete: () => void;
}

export const ProposalsList: React.FC<ProposalsListProps> = ({ 
  onVoteComplete 
}) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [voterObject, setVoterObject] = useState<VoterObject | null>(null);
  const [votingInProgress, setVotingInProgress] = useState<boolean>(false);
  const [votingProposalId, setVotingProposalId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecuteTransactionBlock } = useSignAndExecuteTransaction();
  const { showToast } = useToast();
  const { checkVoterObject } = useVoter();
  const { getProposals } = useProposals();

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
  
  // Fetch proposals from the blockchain
  const fetchProposals = async () => {
    setIsLoading(true);
    
    try {
      // Try to fetch real proposals from the blockchain
      const blockchainProposals = await getProposals(PACKAGE_ID);
      
      if (blockchainProposals && blockchainProposals.length > 0) {
        // Filter out any null values and ensure type safety
        const validProposals = blockchainProposals.filter((p): p is Proposal => p !== null);
        setProposals(validProposals);
      } else {
        // Fallback to mock data if no proposals are found on the blockchain
        const mockProposals: Proposal[] = [
          {
            id: "0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234",
            title: "Support LOSEV",
            vote_count: 24,
            active: true
          },
          {
            id: "0x234567890bcdef234567890bcdef234567890bcdef234567890bcdef2345678",
            title: "Support TEMA Vakfi",
            vote_count: 18,
            active: true
          },
          {
            id: "0x34567890cdef34567890cdef34567890cdef34567890cdef34567890cdef345",
            title: "Fund Blockchain Education",
            vote_count: 31,
            active: true
          }
        ];
        setProposals(mockProposals);
      }
    } catch (error) {
      console.error("Error fetching proposals:", error);
      showToast('error', "Failed to fetch proposals");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle voting on a proposal
  const handleVote = async (proposalId: string, proposalTitle: string) => {
    if (!currentAccount) {
      showToast('error', "Please connect your wallet first");
      return;
    }

    if (!voterObject) {
      showToast('error', "You need to make a donation first to be eligible to vote");
      return;
    }

    if (voterObject.hasVoted) {
      showToast('error', "You have already voted on a proposal");
      return;
    }

    setVotingInProgress(true);
    setVotingProposalId(proposalId);
    setError(null);

    try {
      // Create a transaction block for voting
      const tx = new TransactionBlock();
      
      // Call the vote function with the proposal and voter object
      tx.moveCall({
        target: `${PACKAGE_ID}::donation_and_vote::vote`,
        arguments: [
          tx.object(proposalId), // proposal ID
          tx.object(voterObject.id), // voter object ID
        ],
      });

      // Sign and execute the transaction
      signAndExecuteTransactionBlock(
        {
          transaction: tx as any, // Type cast to avoid version mismatch
        },
        {
          onSuccess: (response) => {
            if (response && response.digest) {
              showToast('success', `Vote cast successfully for "${proposalTitle}"`);
              
              // Update the user's voting status
              setVoterObject(prev => prev ? {...prev, hasVoted: true} : null);
              
              // Update proposal vote count in the UI
              setProposals(proposals.map(p => 
                p.id === proposalId 
                  ? {...p, vote_count: p.vote_count + 1}
                  : p
              ));
              
              // Notify parent component
              onVoteComplete();
            }
            setVotingInProgress(false);
            setVotingProposalId(null);
          },
          onError: (e) => {
            console.error("Voting error:", e);
            setError(`Voting failed: ${e.message}`);
            showToast('error', `Voting failed: ${e.message}`);
            setVotingInProgress(false);
            setVotingProposalId(null);
          },
        }
      );
    } catch (e: any) {
      console.error("Voting preparation error:", e);
      setError(`Voting failed: ${e.message}`);
      showToast('error', `Voting failed: ${e.message}`);
      setVotingInProgress(false);
      setVotingProposalId(null);
    }
  };
  
  // Load proposals and check voter status on component mount
  useEffect(() => {
    fetchProposals();
    
    if (currentAccount) {
      fetchVoterStatus();
    }
  }, [currentAccount]);

  return (
    <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
      <h2 className="text-2xl font-semibold mb-4 text-[#4e6a8a]">Active Proposals</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {!currentAccount ? (
        <div className="py-6 text-center border border-gray-200 rounded-lg">
          <p className="text-[#4e6a8a]">Connect your wallet to view and vote on proposals.</p>
        </div>
      ) : isLoading ? (
        <div className="py-10 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#2f6c8f]"></div>
          <p className="mt-2 text-[#4e6a8a]">Loading proposals...</p>
        </div>
      ) : !voterObject ? (
        <div className="py-6 text-center border border-gray-200 rounded-lg">
          <p className="text-[#4e6a8a] mb-3">You need to make a donation first to be eligible to vote.</p>
        </div>
      ) : voterObject.hasVoted ? (
        <div>
          <div className="mb-4 p-3 bg-white border border-[#2f6c8f] text-[#4e6a8a] rounded-md">
            <p className="font-medium">You have already voted. Each wallet can only vote once.</p>
          </div>
          <div className="divide-y">
            {proposals.map((proposal) => (
              <div key={proposal.id} className="py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-[#4e6a8a]">{proposal.title}</h3>
                    <div className="flex items-center mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white border border-[#2f6c8f] text-[#4e6a8a]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        {proposal.vote_count} votes
                      </span>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${proposal.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {proposal.active ? 'Active' : 'Closed'}
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    disabled={true}
                    className="bg-gray-100 text-gray-400 py-1 px-4 rounded-md cursor-not-allowed"
                  >
                    Already Voted
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : proposals.length > 0 ? (
        <div className="divide-y">
          {proposals.map((proposal) => (
            <div key={proposal.id} className="py-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-[#4e6a8a]">{proposal.title}</h3>
                  <div className="flex items-center mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white border border-[#2f6c8f] text-[#4e6a8a]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      {proposal.vote_count} votes
                    </span>
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${proposal.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {proposal.active ? 'Active' : 'Closed'}
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleVote(proposal.id, proposal.title)}
                  disabled={votingInProgress || voterObject.hasVoted}
                  className={`py-1 px-4 rounded-md text-white font-medium transition-colors duration-200
                    ${votingInProgress || voterObject.hasVoted
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-[#2f6c8f] hover:bg-[#4e6a8a]'}`}
                >
                  {votingInProgress && votingProposalId === proposal.id ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <span>Voting...</span>
                    </div>
                  ) : 'Vote'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center border border-gray-200 rounded-lg">
          <p className="text-[#4e6a8a]">No active proposals available.</p>
        </div>
      )}
    </div>
  );
};