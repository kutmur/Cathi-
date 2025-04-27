import { useCurrentAccount, useSuiClient, useSuiClientQuery } from '@mysten/dapp-kit';
import { formatSUI } from '../constants';
import { useCallback } from 'react';

/**
 * Hook to fetch and format wallet balance using useSuiClientQuery
 */
export const useWalletBalance = () => {
  const currentAccount = useCurrentAccount();
  
  const { data: balanceData, refetch } = useSuiClientQuery('getBalance', {
    owner: currentAccount?.address || '',
    coinType: '0x2::sui::SUI'
  }, {
    enabled: !!currentAccount,
    refetchInterval: 15000, // Refetch every 15 seconds
  });
  
  /**
   * Fetch wallet balance
   * @returns Formatted wallet balance in SUI format
   */
  const getWalletBalance = useCallback(async () => {
    if (!currentAccount) return "0";
    
    try {
      if (!balanceData) {
        await refetch();
        return "Loading...";
      }
      
      return formatSUI(balanceData.totalBalance);
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      return "0";
    }
  }, [currentAccount, balanceData, refetch]);
  
  return { 
    getWalletBalance,
    walletBalance: balanceData ? formatSUI(balanceData.totalBalance) : "0"
  };
};

/**
 * Hook to fetch treasury details
 */
export const useTreasury = () => {
  const suiClient = useSuiClient();
  
  /**
   * Fetch treasury balance
   * @param treasuryId The ID of the treasury object
   * @returns Promise with the treasury balance in SUI format
   */
  const getTreasuryBalance = async (treasuryId: string) => {
    try {
      const treasuryObject = await suiClient.getObject({
        id: treasuryId,
        options: {
          showContent: true,
          showDisplay: true
        },
      });
      
      if (
        treasuryObject && 
        treasuryObject.data && 
        'content' in treasuryObject.data && 
        treasuryObject.data.content?.dataType === 'moveObject'
      ) {
        const fields = treasuryObject.data.content.fields as any;
        if (fields && fields.funds) {
          const balance = fields.funds.fields?.value || "0";
          return formatSUI(balance);
        }
      }
      
      return "0";
    } catch (error) {
      console.error("Error fetching treasury balance:", error);
      return "0";
    }
  };
  
  return { getTreasuryBalance };
};

/**
 * Hook to fetch and manage proposals
 */
export const useProposals = () => {
  const suiClient = useSuiClient();
  
  /**
   * Fetch all active proposals
   * @param packageId The package ID of the DAO module
   * @returns Promise with proposal data
   */
  const getProposals = async (packageId: string) => {
    try {
      // Query objects by type to find proposals
      const proposalObjects = await suiClient.getOwnedObjects({
        // Use a dummy address since proposals are shared objects, but we need to specify owner 
        // for the API. The query will be modified to look for shared objects.
        owner: '0x0000000000000000000000000000000000000000000000000000000000000000',
        filter: {
          MatchAll: [
            {
              StructType: `${packageId}::donation_and_vote::Proposal`
            }
          ]
        },
        options: {
          showContent: true,
          showType: true
        }
      });
      
      // Process and format the proposal data
      const proposals = proposalObjects.data.map(obj => {
        if (
          obj.data &&
          obj.data.content &&
          obj.data.content.dataType === 'moveObject'
        ) {
          const fields = obj.data.content.fields as any;
          return {
            id: obj.data.objectId,
            title: fields.title,
            vote_count: Number(fields.vote_count),
            active: fields.active === true
          };
        }
        return null;
      }).filter(Boolean);
      
      return proposals;
    } catch (error) {
      console.error("Error fetching proposals:", error);
      return [];
    }
  };
  
  return { getProposals };
};

/**
 * Hook to manage voter objects
 */
export const useVoter = () => {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  
  /**
   * Check if the user has a voter object
   * @param packageId The package ID of the DAO module
   * @returns Promise with voter object info if found
   */
  const checkVoterObject = async (packageId: string) => {
    if (!currentAccount) return null;
    
    try {
      // Query for voter objects owned by the current account
      const ownedObjects = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: {
          MatchAll: [
            {
              StructType: `${packageId}::donation_and_vote::Voter`
            }
          ]
        },
        options: {
          showContent: true
        }
      });
      
      if (ownedObjects.data.length === 0) {
        return null;
      }
      
      const voterObject = ownedObjects.data[0];
      
      if (
        voterObject &&
        voterObject.data &&
        voterObject.data.content &&
        voterObject.data.content.dataType === 'moveObject'
      ) {
        const fields = voterObject.data.content.fields as any;
        
        return {
          id: voterObject.data.objectId,
          hasVoted: fields.has_voted || false
        };
      }
      
      return null;
    } catch (error) {
      console.error("Error checking voter object:", error);
      return null;
    }
  };
  
  return { checkVoterObject };
};