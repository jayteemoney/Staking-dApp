import { useState, useEffect } from "react";
import { ethers } from "ethers";
import WalletConnect from "./components/WalletConect";
import StakeForm from "./components/StakeForm";
import UnstakeButton from "./components/UnstakeButton";
import ClaimRewards from "./components/ClaimRewards";
import FitechTokenABI from "./abis/FitechTokenABI.json";
import EthStakingABI from "./abis/EthStakingABI.json";
import { FITTECH_TOKEN_ADDRESS, ETH_STAKING_ADDRESS } from "./config";
import { stakeEth, unstakeEth, claimRewards } from "./services/stakingService";

// Centralized error messages for wallet connection
const WALLET_ERROR_MESSAGES = {
  NO_METAMASK: "Please install MetaMask to connect your wallet.",
  CONNECTION_REJECTED: "Connection rejected by user.",
  PENDING_REQUEST: "MetaMask is processing a request. Please check MetaMask.",
  INVALID_TOKEN_ADDRESS: "Invalid token contract address.",
  INVALID_STAKING_ADDRESS: "Invalid staking contract address.",
  NETWORK_SWITCH_FAILED: "Failed to switch to Sepolia network.",
  CONNECTION_FAILED: "Failed to connect wallet. Please try again.",
};

function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [stakingContract, setStakingContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [balance, setBalance] = useState("0");
  const [stakedAmount, setStakedAmount] = useState("0");
  const [reward, setReward] = useState("0");
  const [tokenBalance, setTokenBalance] = useState("0");
  const [error, setError] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = async () => {
    console.log("Connect Wallet button clicked");
    if (typeof window.ethereum === "undefined") {
      setError(WALLET_ERROR_MESSAGES.NO_METAMASK);
      window.open("https://metamask.io", "_blank");
      console.error("MetaMask not detected");
      setIsConnecting(false);
      return;
    }
    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts.length === 0) {
        await window.ethereum.request({ method: "eth_requestAccounts" });
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId !== BigInt(11155111)) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0xaa36a7" }], // Sepolia
          });
        } catch (switchError) {
          console.error("Network switch error:", switchError);
          setError(WALLET_ERROR_MESSAGES.NETWORK_SWITCH_FAILED);
          setIsConnecting(false);
          return;
        }
      }
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setProvider(provider);
      setAccount(address);

      if (!ethers.isAddress(FITTECH_TOKEN_ADDRESS)) {
        setError(WALLET_ERROR_MESSAGES.INVALID_TOKEN_ADDRESS);
        throw new Error("Invalid FITTECH_TOKEN_ADDRESS: " + FITTECH_TOKEN_ADDRESS);
      }
      if (!ethers.isAddress(ETH_STAKING_ADDRESS)) {
        setError(WALLET_ERROR_MESSAGES.INVALID_STAKING_ADDRESS);
        throw new Error("Invalid ETH_STAKING_ADDRESS: " + ETH_STAKING_ADDRESS);
      }

      const staking = new ethers.Contract(ETH_STAKING_ADDRESS, EthStakingABI, signer);
      setStakingContract(staking);

      const token = new ethers.Contract(FITTECH_TOKEN_ADDRESS, FitechTokenABI, signer);
      setTokenContract(token);

      const balance = await provider.getBalance(address);
      setBalance(ethers.formatEther(balance));
      const stake = await staking.stakes(address);
      setStakedAmount(ethers.formatEther(stake.amount));
      const reward = await staking.calculateReward(address);
      setReward(ethers.formatUnits(reward, 18));
      const tokenBal = await token.balanceOf(address);
      setTokenBalance(ethers.formatUnits(tokenBal, 18));
      setError("");
    } catch (err) {
      console.error("Connection error:", err);
      setError(
        err.code === 4001
          ? WALLET_ERROR_MESSAGES.CONNECTION_REJECTED
          : err.code === -32002
          ? WALLET_ERROR_MESSAGES.PENDING_REQUEST
          : err.message.includes("Invalid FITTECH_TOKEN_ADDRESS")
          ? WALLET_ERROR_MESSAGES.INVALID_TOKEN_ADDRESS
          : err.message.includes("Invalid ETH_STAKING_ADDRESS")
          ? WALLET_ERROR_MESSAGES.INVALID_STAKING_ADDRESS
          : WALLET_ERROR_MESSAGES.CONNECTION_FAILED
      );
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", connectWallet);
      window.ethereum.on("chainChanged", () => window.location.reload());
      return () => {
        window.ethereum.removeAllListeners();
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 text-center">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">
          Stake <i>ETH</i> get <i>FITECHTOKENS</i>
        </h1>
        <WalletConnect
          connectWallet={connectWallet}
          account={account}
          isConnecting={isConnecting}
        />
        {account && (
          <div className="space-y-4 mt-4">
            <p>ETH Balance: {parseFloat(balance).toFixed(4)} ETH</p>
            <p>Staked: {parseFloat(stakedAmount).toFixed(4)} ETH</p>
            <p>Reward: {parseFloat(reward).toFixed(2)} FIT</p>
            <p>FIT Balance: {parseFloat(tokenBalance).toFixed(2)} FIT</p>
            <StakeForm
              stakeAmount={stakeAmount}
              setStakeAmount={setStakeAmount}
              stakeEth={() =>
                stakeEth({
                  stakingContract,
                  provider,
                  account,
                  stakeAmount,
                  setError,
                  setStakeAmount,
                  setStakedAmount,
                  setBalance,
                  setTokenBalance,
                  tokenContract,
                })
              }
            />
            <UnstakeButton
              unstakeEth={() =>
                unstakeEth({
                  stakingContract,
                  provider,
                  account,
                  setError,
                  setStakedAmount,
                  setBalance,
                  setTokenBalance,
                  tokenContract,
                })
              }
            />
            <ClaimRewards
              claimRewards={() =>
                claimRewards({
                  stakingContract,
                  account,
                  setError,
                  setReward,
                  setTokenBalance,
                  tokenContract,
                })
              }
            />
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;