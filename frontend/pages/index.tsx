import type { NextPage } from 'next';
import dynamic from 'next/dynamic';

// Use dynamic import with SSR disabled to prevent hydration issues
const DonationDaoClient = dynamic(
  () => import('../components/DonationDaoClient'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-white py-6 flex items-center justify-center">
        <div className="animate-pulse flex space-x-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: '#2f6c8f' }}></div>
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: '#2f6c8f' }}></div>
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: '#2f6c8f' }}></div>
        </div>
      </div>
    )
  }
);

const ProposalsList = dynamic(
  () => import('../components/ProposalsList'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-white py-6 flex items-center justify-center">
        <div className="animate-pulse flex space-x-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: '#2f6c8f' }}></div>
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: '#2f6c8f' }}></div>
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: '#2f6c8f' }}></div>
        </div>
      </div>
    )
  }
);

const Home: NextPage = () => {
  return (
    <main className="min-h-screen bg-white py-6 flex flex-col">
      <DonationDaoClient />
      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-[#2f6c8f] mb-4 px-4">Active Proposals</h2>
        <ProposalsList />
      </div>
    </main>
  );
};

export default Home;