import '../styles/globals.css';
import '@mysten/dapp-kit/dist/index.css';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import Head from 'next/head';

// Dynamically import AppProviders with SSR disabled to prevent hydration issues
const AppProviders = dynamic(() => import('../components/AppProviders'), { ssr: false });

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Cathi DAO - Donation and Voting Platform</title>
        <meta name="description" content="Contribute to causes and participate in DAO governance via the Sui blockchain" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <AppProviders>
        <Component {...pageProps} />
      </AppProviders>
    </>
  );
}