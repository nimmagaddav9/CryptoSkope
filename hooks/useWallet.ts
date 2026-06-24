import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: ethers.providers.ExternalProvider & {
      isMetaMask?: boolean;
      on?: (event: string, callback: (...args: any[]) => void) => void;
      removeListener?: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

export interface NetworkInfo {
  chainId: string;
  name: string;
}

const NETWORK_NAMES: Record<number, string> = {
  1: 'Ethereum Mainnet',
  5: 'Goerli Testnet',
  11155111: 'Sepolia Testnet',
  137: 'Polygon Mainnet',
  80001: 'Mumbai Testnet',
};

export const useWallet = () => {
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [network, setNetwork] = useState<NetworkInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const getProvider = useCallback(() => {
    if (!window.ethereum) return null;
    return new ethers.providers.Web3Provider(window.ethereum);
  }, []);

  const saveWalletToBackend = useCallback(async (address: string) => {
    try {
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        throw new Error(`Wallet save failed with status ${response.status}`);
      }
    } catch (err) {
      console.error('Failed to save wallet address:', err);
    }
  }, []);

  const updateBalance = useCallback(async (address: string) => {
    const provider = getProvider();
    if (!provider) return;
    try {
      const bal = await provider.getBalance(address); // Uses provider.getBalance() and ethers.utils.formatEther() for balance
      setBalance(ethers.utils.formatEther(bal));
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  }, [getProvider]);

  const updateNetwork = useCallback(async () => {
    const provider = getProvider();
    if (!provider) return;
    try {
      const net = await provider.getNetwork();  // Uses provider.getNetwork() for chain info
      setNetwork({
        chainId: String(net.chainId),
        name: NETWORK_NAMES[net.chainId] || net.name || `Chain ID: ${net.chainId}`,
      });
    } catch (err) {
      console.error('Error fetching network:', err);
    }
  }, [getProvider]);

  useEffect(() => {
    setIsMetaMaskInstalled(!!window.ethereum?.isMetaMask);

    const checkConnection = async () => {
      const provider = getProvider();
      if (!provider) return;
      try {
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          updateBalance(accounts[0]);
          updateNetwork();
          saveWalletToBackend(accounts[0]);
        }
      } catch (err) {
        console.error('Error checking connection:', err);
      }
    };

    checkConnection();

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAccount(null);
        setBalance('0');
        setNetwork(null);
      } else {
        setAccount(accounts[0]);
        updateBalance(accounts[0]);
        updateNetwork();
        saveWalletToBackend(accounts[0]);
      }
    };

    const handleChainChanged = () => { // Reloads page on chain change
      window.location.reload();
    };

    if (window.ethereum?.on) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [getProvider, saveWalletToBackend, updateBalance, updateNetwork]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const provider = getProvider();
      if (!provider) throw new Error('MetaMask is not available');
      const accounts = await provider.send('eth_requestAccounts', []);
      const address = accounts[0];

      if (!address || !ethers.utils.isAddress(address)) {
        throw new Error('MetaMask did not return a valid wallet address');
      }

      setAccount(address);
      updateBalance(address);
      updateNetwork();
      setIsOpen(true);

      await saveWalletToBackend(address);
    } catch (err) {
      setError('Failed to connect wallet');
      console.error('Error connecting wallet:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setBalance('0');
    setNetwork(null);
    setIsOpen(false);
  };

  const toggleWalletMenu = () => {
    setIsOpen(!isOpen);
  };

  return {
    isMetaMaskInstalled,
    account,
    isConnecting,
    error,
    balance,
    network,
    isOpen,
    connectWallet,
    disconnectWallet,
    toggleWalletMenu,
  };
};
