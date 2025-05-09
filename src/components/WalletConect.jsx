import { FaWallet } from "react-icons/fa";

function WalletConnect({ connectWallet, account }) {
  return (
    <div className="w-full">
      {!account ? (
        <button
          onClick={connectWallet}
          className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          <FaWallet className="mr-2" /> Connect Wallet
        </button>
      ) : (
        <p className="text-sm break-all">
          Connected: {account.slice(0, 6)}...{account.slice(-4)}
        </p>
      )}
    </div>
  );
}

export default WalletConnect;