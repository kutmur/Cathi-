import type { NextPage } from 'next';
import dynamic from 'next/dynamic';

// Use dynamic import with SSR disabled to prevent hydration issues
const DonationDaoClient = dynamic(
  () => import('../components/DonationDaoClient').then((mod) => mod.DonationDaoClient),
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
    <main className="min-h-screen bg-white py-6">
      <DonationDaoClient />
    </main>
  );
};

export default Home;