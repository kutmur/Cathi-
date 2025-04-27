import { useSuiClientQuery } from '@mysten/dapp-kit';

export function TreasuryBalance() {
  const TREASURY_ADDRESS = '0x5ce28668f7172dc0d544a274f57a41682ae86b0833329c6d2ae0a922d0a60468';
  
  const { data, isPending, error } = useSuiClientQuery('getBalance', {
    owner: TREASURY_ADDRESS,
    coinType: '0x2::sui::SUI',
  });

  if (isPending) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-medium text-secondary mb-2">Treasury Balance</h2>
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 mr-2 border-primary"></div>
          <span className="text-secondary text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-medium text-secondary mb-2">Treasury Balance</h2>
        <p className="text-red-500 text-lg">Error loading balance</p>
      </div>
    );
  }

  // Convert from MIST to SUI (1 SUI = 10^9 MIST)
  const sui = (BigInt(data.totalBalance) / BigInt(10**9)).toString();

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-medium text-secondary mb-2">Treasury Balance</h2>
      <p className="text-2xl font-bold text-primary">{sui} SUI</p>
    </div>
  );
}