import React, { useState, useEffect } from "react";
import { mnemonicToSeed } from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair, Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import nacl from "tweetnacl";
import { SendMoneyPopup } from "./SendMoneyPopup"; 




//-------------------------------------------
// Load RPC URL from .env
const SOLANA_RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL;

const connection = new Connection(SOLANA_RPC_URL);
//-----------------------------------------------------






export const SolanaWallet = ({ mnemonic }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [publicKeys, setPublicKeys] = useState([]);
  const [expandedWallets, setExpandedWallets] = useState({});
  const [balances, setBalances] = useState({});
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Fetch balances for existing addresses
  useEffect(() => {
    publicKeys.forEach(async (keyInfo) => {
      try {
        const balance = await connection.getBalance(new PublicKey(keyInfo.publicKey));
        const solBalance = balance / 1e9; // Convert lamports to SOL
        setBalances((prev) => ({ ...prev, [keyInfo.index]: solBalance.toFixed(4) }));
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    });
  }, [publicKeys]);

  // Create wallets
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
      const balance = await connection.getBalance(new PublicKey(publicKey));
      const solBalance = balance / 1e9; // Convert lamports to SOL
      setBalances((prev) => ({ ...prev, [index]: solBalance.toFixed(4) }));
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

  const openSendMoneyPopup = (walletInfo) => {
    setSelectedWallet(walletInfo);
    setIsPopupOpen(true);
  };

  const closeSendMoneyPopup = () => {
    setIsPopupOpen(false);
    setSelectedWallet(null);
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
              <button
                onClick={() => openSendMoneyPopup(keyInfo)}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md ml-4"
              >
                Send Money
              </button>
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

      {isPopupOpen && selectedWallet && (
        <SendMoneyPopup
          walletInfo={selectedWallet}
          closePopup={closeSendMoneyPopup}
          connection={connection}
          chainType="solana"
        />
      )}
    </div>
  );
};
