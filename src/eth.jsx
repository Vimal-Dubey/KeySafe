import React, { useState, useEffect } from "react";
import { mnemonicToSeed } from "bip39";
import { Wallet, HDNodeWallet, ethers } from "ethers";
import { SendMoneyPopup } from "./sendmoneypopup";



//-------------------------------------------------------
const INFURA_PROJECT_ID = import.meta.env.VITE_INFURA_PROJECT_ID;

const provider = new ethers.JsonRpcProvider(INFURA_PROJECT_ID);

//----------------------------------------------------------






export const EthWallet = ({ mnemonic }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [addresses, setAddresses] = useState([]);
  const [expandedWallets, setExpandedWallets] = useState({});
  const [balances, setBalances] = useState({});
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Fetch balances for existing addresses
  useEffect(() => {
    addresses.forEach(async (walletInfo) => {
      const balance = await provider.getBalance(walletInfo.address);
      const balanceInEther = ethers.formatEther(balance);
      setBalances((prevBalances) => ({ ...prevBalances, [walletInfo.index]: parseFloat(balanceInEther).toFixed(4) }));
    });
  }, [addresses]);

  //creating wallets 
  const handleCreateWallet = async () => {
    const seed = await mnemonicToSeed(mnemonic);
    const derivationPath = `m/44'/60'/${currentIndex}'/0'`;
    const hdNode = HDNodeWallet.fromSeed(seed);
    const child = hdNode.derivePath(derivationPath);
    const privateKey = child.privateKey;
    const wallet = new Wallet(privateKey);

    setCurrentIndex(currentIndex + 1);
    setAddresses([...addresses, { index: currentIndex, address: wallet.address, privateKey }]);
  };

  const toggleExpandWallet = (index) => {
    setExpandedWallets((prevState) => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  const handleDeleteWallet = (index) => {
    setAddresses(addresses.filter(wallet => wallet.index !== index));
    setBalances((prevBalances) => {
      const newBalances = { ...prevBalances };
      delete newBalances[index];
      return newBalances;
    });
    setExpandedWallets((prevState) => {
      const newState = { ...prevState };
      delete newState[index];
      return newState;
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
        Add ETH Wallet
      </button>

      <div className="mt-6">
        {addresses.map((walletInfo, index) => (
          <div key={index} className="mb-4 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                #Wallet {walletInfo.index}
              </h4>
              <button
                onClick={() => handleDeleteWallet(walletInfo.index)}
                className="text-red-500 hover:text-red-700 text-2xl" // Adjust the size here
                title="Delete Wallet"
              >
                🗑
              </button>

            </div>
            <p className="mb-2 text-gray-800 dark:text-gray-300">
              <strong>Public Address:</strong> {walletInfo.address}
            </p>
            <p className="mb-2 text-gray-800 dark:text-gray-300">
              <strong>Balance:</strong> {balances[walletInfo.index] || "Fetching..."} ETH
              <button
                onClick={() => openSendMoneyPopup(walletInfo)}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md ml-4"
              >
                Send Money
              </button>
            </p>

            {expandedWallets[index] && (
              <div className="mt-4">
                <p className="mb-2 text-gray-800 dark:text-gray-300">
                  <strong>Private Key:</strong> {walletInfo.privateKey}
                </p>
                <button
                  onClick={() => navigator.clipboard.writeText(walletInfo.privateKey)}
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
                onClick={() => navigator.clipboard.writeText(walletInfo.address)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all duration-300"
              >
                Copy Public Address
              </button>
            </div>
          </div>
        ))}
      </div>

      {isPopupOpen && selectedWallet && (
        <SendMoneyPopup
        walletInfo={selectedWallet}
        closePopup={closeSendMoneyPopup}
        provider={provider}
        chainType="ethereum"
      />
      )}
    </div>
  );
};
