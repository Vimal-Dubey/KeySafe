import React, { useState } from "react";
import { ethers } from "ethers";
import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from "@solana/web3.js";

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

export const SendMoneyPopup = ({ walletInfo, closePopup, provider, chainType }) => {
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async () => {
    setError(null);
    if (chainType === "ethereum") {
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

      setIsConfirming(true);
    } else if (chainType === "solana") {
      try {
        const connection = new Connection(provider, 'confirmed');
        const balance = await connection.getBalance(new PublicKey(walletInfo.publicKey));
        if (parseFloat(amount) * 1e9 > balance) { // Convert SOL to lamports
          setError("Insufficient funds");
          return;
        }
        setIsConfirming(true);
      } catch (error) {
        setError("Error fetching balance");
      }
    }
  };

  const confirmTransaction = async () => {
    setIsProcessing(true);
    setIsSuccess(false);

    if (chainType === "ethereum") {
      const wallet = new ethers.Wallet(walletInfo.privateKey, provider);
      try {
        const tx = await wallet.sendTransaction({
          to: recipientAddress,
          value: ethers.parseEther(amount),
        });
        await tx.wait();
        setIsSuccess(true);
      } catch (error) {
        setError("Transaction failed: " + error.message);
      } finally {
        setIsProcessing(false);
      }
    } else if (chainType === "solana") {
      try {
        const connection = new Connection(provider, 'confirmed');
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: new PublicKey(walletInfo.publicKey),
            toPubkey: new PublicKey(recipientAddress),
            lamports: Number(amount) * 1e9 // Convert SOL to lamports
          })
        );

        const wallet = Keypair.fromSecretKey(new Uint8Array(Buffer.from(walletInfo.privateKey, "hex")));
        const signature = await connection.sendTransaction(transaction, [wallet]);
        await connection.confirmTransaction(signature);
        setIsSuccess(true);
      } catch (error) {
        setError("Transaction failed: " + error.message);
      } finally {
        setIsProcessing(false);
      }
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
        <h2 className="dark:text-white text-xl font-bold mb-4">
          Sending {chainType === "ethereum" ? "ETH" : "SOL"}
        </h2>
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
                  placeholder={chainType === "ethereum" ? "0x..." : "Public Key"}
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
                Amount ({chainType === "ethereum" ? "ETH" : "SOL"})
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
              Do you want to send <strong>{amount} {chainType === "ethereum" ? "ETH" : "SOL"}</strong> from{" "}
              <strong>{walletInfo.address}</strong> to{" "}
              <strong>{recipientAddress}</strong>?
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
