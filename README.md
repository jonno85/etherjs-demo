# Ethereum DApp Demo with Ethers.js

This project is a demonstration application showcasing how to build a decentralized application (DApp) that interacts with the Ethereum blockchain using `ethers.js`. It demonstrates core functionalities such as connecting to a user's wallet, displaying token information, and performing token transfers.

## Features

*   **Wallet Connection:** Connects to a user's Ethereum wallet (e.g., MetaMask) using `ethers.js`.
*   **Network Detection:** Detects the current network and prompts the user to switch to the Sepolia testnet if they are on the wrong network.
*   **Token Information:** Fetches and displays the name and symbol of a deployed ERC-20 token contract.
*   **Token Balance:** Retrieves and displays the user's token balance.
*   **Token Transfers:** Allows users to transfer tokens to other Ethereum addresses.
*   **Transaction Handling:** Handles transaction sending, waiting for confirmation, and error handling.
*   **Error Handling:** Gracefully handles various errors, including network issues, user-rejected transactions, and contract-related errors.
*   **Disconnect Wallet:** Allows users to disconnect their wallet from the DApp.
* **Contract verification**: Verify if the contract exists at the specified address.
* **Add network**: Add the Sepolia network to MetaMask if it's not already added.

## Technologies Used

*   **React:** A JavaScript library for building user interfaces.
*   **Ethers.js:** A powerful library for interacting with the Ethereum blockchain.
*   **ERC-20 Token:** A standard interface for fungible tokens on Ethereum.
*   **Sepolia Testnet:** An Ethereum test network used for development and testing.
* **Hardhat**: A development environment to compile, deploy, test, and debug your Ethereum software.

## Prerequisites

*   **Node.js and npm:** Make sure you have Node.js and npm (or yarn) installed on your system.
*   **Ethereum Wallet:** You'll need an Ethereum wallet like MetaMask installed in your browser.
*   **Sepolia Testnet ETH:** You'll need some Sepolia ETH to interact with the contract. You can get some from a Sepolia faucet.

## Getting Started

1.  **Clone the Repository:**

    ```bash
    git clone <your-repository-url>
    cd hard-hat-tutorial
    ```

2.  **Install Dependencies:**

    ```bash
    cd frontend
    yarn install
    ```

3.  **Environment Variables:**
    *   Create a `.env` file in the root of the project.
    *   Add the following variable:
        ```
        NETWORK_ID=11155111
        ```
    * You can change the `NETWORK_ID` to another network if you want to deploy to another network.

4.  **Start the Development Server:**

    ```bash
    yarn start
    ```

    This will start the React development server, and you can access the DApp in your browser at `http://localhost:3000`.

## Contract Deployment

1.  **Deploy the Token Contract:**
    *   Navigate to the root of the project.
    *   Deploy the `Token` contract using Hardhat:

        ```bash
        npx hardhat run scripts/deploy.js --network sepolia
        ```

    *   **Note:** You'll need to configure your Hardhat project with your Sepolia RPC URL and private key.
    *   **Note:** You can change the network to another network if you want to deploy to another network.

2.  **Update the `TOKEN` Constant:**
    *   After deploying the `Token` contract, copy the deployed contract address.
    *   Open `frontend/src/components/Dapp.js`.
    *   Replace the value of the `TOKEN` constant with the deployed contract address:

        ```javascript
        const TOKEN = '0x<your-deployed-token-contract-address>';
        ```

3. **Copy the files**:
    * Copy the `Token.json` file from `artifacts/contracts` to `frontend/src/contracts`.
    * Copy the `ContractAddress.json` file from `artifacts/contracts` to `frontend/src/contracts`.

## Interacting with the DApp

1.  **Connect Wallet:** Click the "Connect Wallet" button to connect your Ethereum wallet.
2.  **View Token Information:** Once connected, the DApp will display the token's name, symbol, and your balance.
3.  **Transfer Tokens:** Use the transfer form to send tokens to another Ethereum address.
4.  **Disconnect Wallet:** Click the "Disconnect Wallet" button to disconnect your wallet.

## Code Structure

*   **`frontend/src/components/Dapp.js`:** The main component that handles wallet connection, contract interaction, and UI rendering.
*   **`frontend/src/components/ConnectWallet.js`:** The component that displays the "Connect Wallet" button.
*   **`frontend/src/components/Loading.js`:** The component that displays a loading message.
*   **`frontend/src/components/NoWalletDetected.js`:** The component that displays a message if no wallet is detected.
*   **`frontend/src/components/Transfer.js`:** The component that displays the token transfer form.
*   **`frontend/src/components/TransactionErrorMessage.js`:** The component that displays transaction error messages.
*   **`frontend/src/components/WaitingForTransactionMessage.js`:** The component that displays a message while waiting for a transaction to be mined.
*   **`frontend/src/components/NoTokensMessage.js`:** The component that displays a message when the user has no tokens.
*   **`frontend/src/contracts/Token.json`:** The ABI of the `Token` contract.
* **`frontend/src/contracts/ContractAddress.json`**: The ABI of the `ContractAddress` contract.
* **`scripts/deploy.js`**: The script to deploy the contract.

## Key Concepts Demonstrated

*   **`ethers.js`:**
    *   `BrowserProvider`: Connecting to a browser-injected Ethereum provider.
    *   `Contract`: Interacting with smart contracts.
    *   `getSigner`: Getting a signer to send transactions.
    *   `formatEther`: Formatting Ether values for display.
    * `parseEther`: Parsing Ether values from string.
    * `Network`: Creating a custom network.
*   **React Hooks:**
    *   `useState`: Managing component state.
    *   `useEffect`: Handling side effects.
    *   `useCallback`: Memoizing functions.
*   **Ethereum Wallet Interaction:**
    *   `eth_requestAccounts`: Requesting access to user accounts.
    *   `accountsChanged`: Handling account changes.
    *   `wallet_switchEthereumChain`: Requesting network switching.
    * `wallet_addEthereumChain`: Requesting to add a network.
*   **ERC-20 Token Interaction:**
    *   `name()`: Getting the token name.
    *   `symbol()`: Getting the token symbol.
    *   `balanceOf()`: Getting the token balance.
    *   `transfer()`: Transferring tokens.
* **Contract verification**: Verify if the contract exists at the specified address.
* **Add network**: Add the Sepolia network to MetaMask if it's not already added.

## License

MIT
