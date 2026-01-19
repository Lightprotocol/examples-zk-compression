import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import { createSolanaRpc } from '@solana/kit';
import App from './App';
import './index.css';

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: true,
});

const heliusRpcUrl = import.meta.env.VITE_HELIUS_RPC_URL;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID}
      config={{
        appearance: {
          theme: 'light',
          accentColor: '#676FFF',
        },
        solana: {
          rpcs: {
            'solana:devnet': {
              rpc: createSolanaRpc(heliusRpcUrl),
            },
          },
        },
        embeddedWallets: {
          solana: {
            createOnLogin: 'all-users',
          },
        },
        externalWallets: {
          solana: {
            connectors: solanaConnectors,
          },
        },
      }}
    >
      <App />
    </PrivyProvider>
  </StrictMode>
);
