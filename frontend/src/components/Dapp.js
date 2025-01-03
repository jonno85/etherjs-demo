import React, { useState, useEffect, useCallback } from "react";

import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";

import TokenArtifact from "../contracts/Token.json";

import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { Transfer } from "./Transfer";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";
import { NoTokensMessage } from "./NoTokensMessage";

// Network IDs
const SEPOLIA_NETWORK_ID = 11155111;

// Use Sepolia network ID since we've deployed to Sepolia
const NETWORK_ID = process.env.NETWORK_ID || SEPOLIA_NETWORK_ID;

// Error codes for MetaMask interactions
const ERROR_CODE_TX_REJECTED_BY_USER = 4001; // User rejected the transaction
const ERROR_CODE_CHAIN_NOT_ON_METAMASK = 4902; // Chain not added to MetaMask

// The token contract address on Sepolia testnet
const TOKEN = '0x444f88A444dD32D5bA3e5472162ABD42F8d5B72F';

/**
 * Verifies if a contract exists at the specified address
 * @param {BrowserProvider} provider - The ethers provider
 * @param {string} address - The contract address to verify
 * @returns {Promise<boolean>} - True if contract exists, false otherwise
 */
const verifyContractAddress = async (provider, address) => {
  try {
    // Check if we're on the right network first
    if (window.ethereum.networkVersion !== NETWORK_ID.toString()) {
      console.warn(`Network mismatch! Current: ${window.ethereum.networkVersion}, Expected: ${NETWORK_ID}`);
    }

    // Get the code at the address
    const code = await provider.getCode(address);

    // If there's no code at this address, it's not a contract
    const isContract = code !== '0x';

    if (!isContract) {
      console.error("No contract found at the specified address. Check network and address.");
    }

    return isContract;
  } catch (error) {
    console.error("Error verifying contract address:", error);
    return false;
  }
};

// This component is in charge of doing these things:
//   1. It connects to the user's wallet
//   2. Initializes ethers and the Token contract
//   3. Polls the user balance to keep it updated.
//   4. Transfers tokens by sending transactions
//   5. Renders the whole application
//
export function Dapp() {
  const [tokenData, setTokenData] = useState(undefined);
  const [selectedAddress, setSelectedAddress] = useState(undefined);
  const [balance, setBalance] = useState(parseEther("0"));
  const [txBeingSent, setTxBeingSent] = useState(undefined);
  const [transactionError, setTransactionError] = useState(undefined);
  const [networkError, setNetworkError] = useState(undefined);
  const [contract, setContract] = useState(undefined);
  const [pollingInterval, setPollingInterval] = useState(undefined);
  const [isConnecting, setIsConnecting] = useState(false);

  const resetState = useCallback(() => {
    setTokenData(undefined);
    setSelectedAddress(undefined);
    setBalance(parseEther("0"));
    setTxBeingSent(undefined);
    setTransactionError(undefined);
    setNetworkError(undefined);
    setContract(undefined);
    setPollingInterval(undefined);
  }, []);

  /**
   * Initialize ethers.js with the provider and create a contract instance
   * @param {BrowserProvider} newProvider - The ethers provider
   * @returns {Promise<Contract|null>} - The contract instance or null if initialization fails
   */
  const initializeEthers = useCallback(async (newProvider) => {
    try {
      // Verify the contract address first
      const isValidContract = await verifyContractAddress(newProvider, TOKEN);

      if (!isValidContract) {
        console.error("No valid contract found at address:", TOKEN);
        return null;
      }

      // Get signer and create contract
      const signer = await newProvider.getSigner(0);
      const contract = new Contract(TOKEN, TokenArtifact.abi, signer);

      // Set the contract in state
      setContract(contract);

      // Return the contract for immediate use if needed
      return contract;
    } catch (error) {
      console.error("Error in initializeEthers:", error);
      return null;
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    resetState();
  }, [resetState]);

  const getTokenData = useCallback(async () => {
    try {
      console.log("getTokenData - contract:", contract);

      if (!contract) {
        console.warn("Contract not initialized yet");
        return;
      }

      console.log("Fetching token name...");
      const name = await contract.name();
      console.log("Token name:", name);

      console.log("Fetching token symbol...");
      const symbol = await contract.symbol();
      console.log("Token symbol:", symbol);

      console.log("Setting token data in state");
      setTokenData({ name, symbol });
    } catch (error) {
      console.error("Error getting token data:", error);
      throw new Error(`Failed to get token data: ${error.message}`);
    }
  }, [contract]);

  /**
   * Update the user's token balance
   */
  const updateBalance = useCallback(async () => {
    try {
      if (!selectedAddress || !contract) {
        return;
      }

      try {
        const newBalance = await contract.balanceOf(selectedAddress);
        setBalance(newBalance);
      } catch (balanceError) {
        console.error("Error fetching balance:", balanceError);
        // Set a default balance of 0 to avoid loading screen
        setBalance(parseEther("0"));
      }
    } catch (error) {
      console.error("Error in updateBalance:", error);
      setBalance(parseEther("0"));
    }
  }, [contract, selectedAddress]);

  /**
   * Start polling for balance updates
   */
  const startPollingData = useCallback(() => {
    if (!selectedAddress) {
      return;
    }

    // Clear any existing polling interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Set up new polling interval
    const interval = setInterval(() => {
      if (selectedAddress) {
        updateBalance();
      }
    }, 1000);

    setPollingInterval(interval);

    // Do an immediate balance update
    updateBalance();
  }, [updateBalance, selectedAddress, pollingInterval]);

  /**
   * Initialize the application with the user's address
   * @param {string} userAddress - The user's Ethereum address
   */
  const initialize = useCallback(async (userAddress) => {
    try {
      // Set the selected address in state
      setSelectedAddress(userAddress);

      // Check if we're on the right network
      if (window.ethereum.networkVersion !== NETWORK_ID.toString()) {
        console.warn(`Network mismatch! Current: ${window.ethereum.networkVersion}, Expected: ${NETWORK_ID}`);
      }

      // Create provider and initialize ethers
      const newProvider = new BrowserProvider(window.ethereum);
      const contractInstance = await initializeEthers(newProvider);

      if (contractInstance) {
        try {
          // Get token data
          const name = await contractInstance.name();
          const symbol = await contractInstance.symbol();
          setTokenData({ name, symbol });

          // Get initial balance
          const balance = await contractInstance.balanceOf(userAddress);
          setBalance(balance);
        } catch (error) {
          console.error("Error getting token data:", error);
          await getTokenData();
        }

        // Use a small timeout to ensure state updates have propagated
        setTimeout(() => {
          startPollingData();
        }, 100);
      } else {
        // Set default values if contract initialization fails
        setTokenData({ name: "Token", symbol: "TKN" });
        setBalance(parseEther("0"));
      }
    } catch (error) {
      console.error("Error in initialize:", error);
    }
  }, [initializeEthers, getTokenData, startPollingData]);

  const stopPollingData = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(undefined);
    }
  }, [pollingInterval]);

  const dismissTransactionError = useCallback(() => {
    setTransactionError(undefined);
  }, []);

  const transferTokens = useCallback(async (to, amount) => {
    try {
      dismissTransactionError();
      const tx = await contract.transfer(to, amount);
      setTxBeingSent(tx.hash);
      const receipt = await tx.wait();
      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }
      await updateBalance();
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }
      console.error(error);
      setTransactionError(error);
    } finally {
      setTxBeingSent(undefined);
    }
  }, [contract, updateBalance, dismissTransactionError]);

  const dismissNetworkError = useCallback(() => {
    setNetworkError(undefined);
  }, []);

  const getRpcErrorMessage = useCallback((error) => {
    if (error.data) {
      return error.data.message;
    }
    return error.message;
  }, []);

  const switchChain = useCallback(async () => {
    const chainIdHex = `0x${NETWORK_ID.toString(16)}`;
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
    await initialize(selectedAddress);
  }, [initialize, selectedAddress]);

  /**
   * Check if the user is on the correct network and switch if needed
   */
  const checkNetwork = useCallback(async () => {
    try {
      // Check if we need to switch networks
      if (window.ethereum.networkVersion !== NETWORK_ID.toString()) {
        try {
          // Try to switch to the correct network
          await switchChain();
        } catch (switchError) {
          // If the network is not available in MetaMask, try to add it
          if (switchError.code === ERROR_CODE_CHAIN_NOT_ON_METAMASK) {
            try {
              // Add Sepolia network to MetaMask
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: `0x${NETWORK_ID.toString(16)}`,
                  chainName: 'Sepolia Testnet',
                  nativeCurrency: {
                    name: 'Sepolia ETH',
                    symbol: 'ETH',
                    decimals: 18
                  },
                  rpcUrls: ['https://sepolia.infura.io/v3/'],
                  blockExplorerUrls: ['https://sepolia.etherscan.io']
                }]
              });

              // Try switching again after adding the network
              await switchChain();
            } catch (addError) {
              throw new Error(`Failed to add Sepolia network: ${addError.message}`);
            }
          } else {
            throw switchError;
          }
        }
      }
    } catch (error) {
      throw new Error(`Network error: ${error.message}`);
    }
  }, [switchChain]);

  /**
   * Connect to the user's wallet
   */
  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    try {
      // Request accounts from the wallet
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned from wallet");
      }

      const newSelectedAddress = accounts[0];

      // Check if we need to switch networks
      if (window.ethereum.networkVersion !== NETWORK_ID.toString()) {
        try {
          await checkNetwork();
        } catch (networkError) {
          setNetworkError("Please connect to the Sepolia testnet. " + networkError.message);
        }
      }

      // Initialize the application with the selected address
      try {
        await initialize(newSelectedAddress);
        setNetworkError(undefined);
      } catch (initError) {
        setNetworkError("Failed to initialize the application. Please make sure you're connected to Sepolia testnet and refresh the page.");
        resetState();
        return;
      }
    } catch (error) {
      setNetworkError(error.message || "Failed to connect wallet");
      resetState();
    } finally {
      setIsConnecting(false);
    }
  }, [checkNetwork, initialize, resetState]);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", ([newAddress]) => {
        stopPollingData();
        if (newAddress === undefined) {
          return resetState();
        }
        initialize(newAddress);
      });
    }
    return () => {
      stopPollingData();
    };
  }, [initialize, resetState, stopPollingData]);

  useEffect(() => {
    return () => {
      stopPollingData();
    };
  }, [stopPollingData]);

  if (window.ethereum === undefined) {
    return <NoWalletDetected />;
  }

  if (!selectedAddress) {
    return (
      <ConnectWallet
        connectWallet={connectWallet}
        networkError={networkError}
        dismiss={dismissNetworkError}
        isConnecting={isConnecting}
      />
    );
  }

  if (!tokenData || !balance) {
    return <Loading />;
  }

  return (
    <div className="container p-4">
      <div className="row">
        <div className="col-12">
          <h1>
            {tokenData.name} ({tokenData.symbol})
          </h1>
          <p>
            Welcome <b>{selectedAddress}</b>, you have{" "}
            <b>
              {formatEther(balance)} {tokenData.symbol}
            </b>
            .
          </p>
          <button className="btn btn-danger" onClick={disconnectWallet}>
            Disconnect Wallet
          </button>
        </div>
      </div>

      <hr />

      <div className="row">
        <div className="col-12">
          {txBeingSent && (
            <WaitingForTransactionMessage txHash={txBeingSent} />
          )}

          {transactionError && (
            <TransactionErrorMessage
              message={getRpcErrorMessage(transactionError)}
              dismiss={dismissTransactionError()}
            />
          )}
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          {!!balance && balance === 0 && (
            <NoTokensMessage selectedAddress={selectedAddress} />
          )}
          {!!balance && balance >= 0 && (
            <Transfer
              transferTokens={transferTokens}
              tokenSymbol={tokenData.symbol}
            />
          )}
        </div>
      </div>
    </div>
  );
}
