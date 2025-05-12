import { FaWallet } from "react-icons/fa";

function WalletConnect({ connectWallet, account, isConnecting }) {
  return (
    <div className="w-full space-y-2">
      {!account ? (
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className={`w-full flex items-center justify-center text-white py-2 px-4 rounded ${
            isConnecting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          <FaWallet className="mr-2" />
          {isConnecting ? "Connecting..." : "Connect Wallet"}
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