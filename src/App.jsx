import { useState, useEffect } from "react";
import { ethers } from "ethers";
import WalletConnect from "./components/WalletConnect";
import StakeForm from "./components/StakeForm";
import UnstakeButton from "./components/UnstakeButton";
import ClaimRewards from "./components/ClaimRewards";
import FitechTokenABI from "./abis/FitechTokenABI.json";
import EthStakingABI from "./abis/EthStakingABI.json";
import { FITTECH_TOKEN_ADDRESS, ETH_STAKING_ADDRESS } from "./config";

function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [stakingContract, setStakingContract] = useState(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [balance, setBalance] = useState("0");
  const [stakedAmount, setStakedAmount] = useState("0");
  const [reward, setReward] = useState("0");
  const [error, setError] = useState("");

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError("MetaMask not installed");
        return;
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setProvider(provider);
      setAccount(address);

      // Initialize staking contract
      const staking = new ethers.Contract(
        ETH_STAKING_ADDRESS,
        EthStakingABI,
        signer
      );
      setStakingContract(staking);

      // Fetch balance and stake data
      const balance = await provider.getBalance(address);
      setBalance(ethers.utils.formatEther(balance));
      const stake = await staking.stakes(address);
      setStakedAmount(ethers.utils.formatEther(stake.amount));
      const reward = await staking.calculateReward(address);
      setReward(ethers.utils.formatUnits(reward, 18));
    } catch (err) {
      setError("Failed to connect wallet: " + err.message);
    }
  };

  // Stake ETH
  const stakeEth = async () => {
    try {
      if (!stakeAmount || isNaN(stakeAmount) || stakeAmount <= 0) {
        setError("Enter a valid amount");
        return;
      }
      const tx = await stakingContract.stake({
        value: ethers.utils.parseEther(stakeAmount),
      });
      await tx.wait();
      setStakeAmount("");
      setError("");
      const stake = await stakingContract.stakes(account);
      setStakedAmount(ethers.utils.formatEther(stake.amount));
      setBalance(ethers.utils.formatEther(await provider.getBalance(account)));
    } catch (err) {
      setError("Staking failed: " + err.message);
    }
  };

  // Unstake ETH
  const unstakeEth = async () => {
    try {
      const tx = await stakingContract.unstake();
      await tx.wait();
      setError("");
      const stake = await stakingContract.stakes(account);
      setStakedAmount(ethers.utils.formatEther(stake.amount));
      setBalance(ethers.utils.formatEther(await provider.getBalance(account)));
    } catch (err) {
      setError("Unstaking failed: " + err.message);
    }
  };

  // Claim Rewards
  const claimRewards = async () => {
    try {
      const tx = await stakingContract.claimReward();
      await tx.wait();
      setError("");
      const reward = await stakingContract.calculateReward(account);
      setReward(ethers.utils.formatUnits(reward, 18));
    } catch (err) {
      setError("Claiming rewards failed: " + err.message);
    }
  };

  // Listen for account/network changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", () => connectWallet());
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">
          ETH Staking DApp
        </h1>
        <WalletConnect connectWallet={connectWallet} account={account} />
        {account && (
          <div className="space-y-4 mt-4">
            <p>ETH Balance: {parseFloat(balance).toFixed(4)} ETH</p>
            <p>Staked: {parseFloat(stakedAmount).toFixed(4)} ETH</p>
            <p>Reward: {parseFloat(reward).toFixed(2)} FIT</p>
            <StakeForm
              stakeAmount={stakeAmount}
              setStakeAmount={setStakeAmount}
              stakeEth={stakeEth}
            />
            <UnstakeButton unstakeEth={unstakeEth} />
            <ClaimRewards claimRewards={claimRewards} />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;