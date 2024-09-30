RPC for ethereum => infura => https://mainnet.infura.io/v3/df4d2703bfc34a779192b415ac208255

sepolia test seed phrase => arrow infant moral ceiling worth lion gaze smart erode cradle abstract access



------------------------sendmoneypopup.jsx------------------------

import React, { useState } from "react";
import { ethers } from "ethers";

// Loading Spinner Component 
const LoadingSpinner = () => (
  <div className="flex justify-center items-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

// Success Tick Component (shows after a successful transaction)
const SuccessTick = () => (
  <div className="flex justify-center items-center">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-12 w-12 text-green-500"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 10-1.414-1.414L9 10.586 7.707 9.293a1 1 0 10-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  </div>
);

export const SendMoneyPopup = ({ walletInfo, closePopup, provider }) => {
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // New state for success
  const [error, setError] = useState(null);

  const handleSend = async () => {
    setError(null);
    if (!ethers.isAddress(recipientAddress)) {
      setError("Invalid recipient address");
      return;
    }

    const balance = await provider.getBalance(walletInfo.address);
    const balanceInEther = ethers.formatEther(balance);
    if (parseFloat(amount) > parseFloat(balanceInEther)) {
      setError("Insufficient funds");
      return;
    }

    // Show confirmation popup before sending the transaction
    setIsConfirming(true);
  };

  const confirmTransaction = async () => {
    setIsProcessing(true); // Start the loading animation

    const wallet = new ethers.Wallet(walletInfo.privateKey, provider);
    try {
      const tx = await wallet.sendTransaction({
        to: recipientAddress,
        value: ethers.parseEther(amount),
      });
      await tx.wait();
      setIsSuccess(true); // Show the success tick
    } catch (error) {
      setError("Transaction failed: " + error.message);
    } finally {
      setIsProcessing(false); // Stop the loading animation
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-1/3">
        <button
          onClick={closePopup}
          className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          title="Close"
        >
          &times;
        </button>
        <h2 className="dark:text-white text-xl font-bold mb-4">Sending ETH</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {!isConfirming && !isProcessing && !isSuccess && (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">
                Recipient Address
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 p-2 rounded-l-md w-full"
                  placeholder="0x..."
                />
                <button
                  onClick={() =>
                    navigator.clipboard
                      .readText()
                      .then((text) => setRecipientAddress(text))
                  }
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-r-md"
                >
                  Paste
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">
                Amount (ETH)
              </label>
              <input
                type="number"
                step="0.0001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 p-2 rounded-md w-full"
                placeholder="0.0"
              />
            </div>
            <button
              onClick={handleSend}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md"
            >
              Send
            </button>
          </>
        )}

        {/* Show the confirmation step */}
        {isConfirming && !isProcessing && !isSuccess && (
          <div>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Do you want to send <strong>{amount} ETH</strong> from{" "}
              <strong>{walletInfo.address}</strong> to{" "}
              <strong>{recipientAddress}</strong>. <p className="text-red-700 dark:text-red-300 mb-4">Click confirm to proceed - </p>
            </p>
            <div className="flex justify-between">
              <button
                onClick={confirmTransaction}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md"
              >
                Confirm
              </button>
              <button
                onClick={() => setIsConfirming(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Show the loading animation while the transaction is being processed */}
        {isProcessing && !isSuccess && <LoadingSpinner />}

        {/* Show the success tick after the transaction is successful */}
        {isSuccess && <SuccessTick />}
      </div>
    </div>
  );
};





---------------------sol.jsx--------------------------------------

import React, { useState } from "react";
import { mnemonicToSeed } from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair, Connection, PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";

export const SolanaWallet = ({ mnemonic }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [publicKeys, setPublicKeys] = useState([]);
  const [expandedWallets, setExpandedWallets] = useState({});
  const [balances, setBalances] = useState({}); 

  const SOLANA_RPC_URL = "https://solana-devnet.g.alchemy.com/v2/hLAInhtI9lD2IdMCY6LvvNSbYRkDBafY";

// wallet creation

  const handleCreateWallet = async () => {
    const seed = await mnemonicToSeed(mnemonic);
    const path = `m/44'/501'/${currentIndex}'/0'`;
    const derivedSeed = derivePath(path, seed.toString("hex")).key;
    const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
    const keypair = Keypair.fromSecretKey(secret);

    const newAddress = keypair.publicKey.toBase58();
    setCurrentIndex(currentIndex + 1);
    setPublicKeys([...publicKeys, { index: currentIndex, publicKey: newAddress, privateKey: Buffer.from(secret).toString("hex") }]);

    // Fetch balance
    fetchBalance(newAddress, currentIndex);
  };

  const fetchBalance = async (publicKey, index) => {
    try {
      const connection = new Connection(SOLANA_RPC_URL);
      const balance = await connection.getBalance(new PublicKey(publicKey));
      const solBalance = balance / 1e9; // Convert lamports to SOL
      setBalances((prev) => ({ ...prev, [index]: solBalance.toFixed(4) })); // Limit to 4 decimal places
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const toggleExpandWallet = (index) => {
    setExpandedWallets((prevState) => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  const handleDeleteWallet = (index) => {
    setPublicKeys(publicKeys.filter((keyInfo) => keyInfo.index !== index));
    setExpandedWallets((prevState) => {
      const newState = { ...prevState };
      delete newState[index];
      return newState;
    });
    setBalances((prev) => {
      const newBalances = { ...prev };
      delete newBalances[index];
      return newBalances;
    });
  };

  return (
    <div className="wallet-component">
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-all duration-300"
        onClick={handleCreateWallet}
      >
        Add Solana Wallet
      </button>

      <div className="mt-6">
        {publicKeys.map((keyInfo, index) => (
          <div key={index} className="mb-4 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                Wallet #{keyInfo.index}
              </h4>
              <button
                onClick={() => handleDeleteWallet(keyInfo.index)}
                className="text-red-500 hover:text-red-700 text-2xl"
                title="Delete Wallet"
              >
                🗑
              </button>
            </div>
            <p className="mb-2 text-gray-800 dark:text-gray-300">
              <strong>Public Key:</strong> {keyInfo.publicKey}
            </p>
            <p className="mb-2 text-gray-800 dark:text-gray-300">
              <strong>Balance:</strong> {balances[keyInfo.index] !== undefined ? `${balances[keyInfo.index]} SOL` : "Fetching..."}
            </p>

            {expandedWallets[index] && (
              <div className="mt-4">
                <p className="mb-2 text-gray-800 dark:text-gray-300">
                  <strong>Private Key:</strong>
                  <span
                    className="block break-words word-wrap break-all bg-gray-200 dark:bg-gray-700 p-2 rounded-md"
                    style={{ wordWrap: "break-word", wordBreak: "break-all" }}
                  >
                    {keyInfo.privateKey}
                  </span>
                </p>
                <button
                  onClick={() => navigator.clipboard.writeText(keyInfo.privateKey)}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all duration-300"
                >
                  Copy Private Key
                </button>
              </div>
            )}

            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => toggleExpandWallet(index)}
                className="bg-gray-300 dark:bg-gray-700 text-black dark:text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-all duration-300"
              >
                {expandedWallets[index] ? "▲ Hide private key" : "▼ Show private key"}
              </button>

              <button
                onClick={() => navigator.clipboard.writeText(keyInfo.publicKey)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all duration-300"
              >
                Copy Public Key
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};




