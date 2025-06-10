import { useState, useEffect } from "react";
import * as ethers from "ethers";
import WalletConnect from "./components/WalletConect";
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
  const [tokenContract, setTokenContract] = useState(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [balance, setBalance] = useState("0");
  const [stakedAmount, setStakedAmount] = useState("0");
  const [reward, setReward] = useState("0");
  const [tokenBalance, setTokenBalance] = useState("0");
  const [error, setError] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const connectWallet = async () => {
    if (!window.ethereum || !ethers) {
      setError("Please install MetaMask and ensure Ethers.js is loaded.");
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
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xaa36a7" }],
        });
      }

      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setProvider(provider);
      setAccount(address);

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
    } catch (err) {
      console.error("Connection error:", err);
      setError("Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const stakeEth = async () => {
    try {
      if (!stakeAmount || isNaN(stakeAmount) || stakeAmount <= 0) {
        setError("Enter a valid amount");
        return;
      }

      const tx = await stakingContract.stake({
        value: ethers.parseEther(stakeAmount),
      });
      await tx.wait();
      setStakeAmount("");
      setError("");

      const stake = await stakingContract.stakes(account);
      setStakedAmount(ethers.formatEther(stake.amount));
      setBalance(ethers.formatEther(await provider.getBalance(account)));

      const tokenBal = await tokenContract.balanceOf(account);
      setTokenBalance(ethers.formatUnits(tokenBal, 18));
    } catch (err) {
      console.error("Staking error:", err);
      setError("Failed to stake ETH");
    }
  };

  const unstakeEth = async () => {
    try {
      const tx = await stakingContract.unstake();
      await tx.wait();
      setError("");

      const stake = await stakingContract.stakes(account);
      setStakedAmount(ethers.formatEther(stake.amount));
      setBalance(ethers.formatEther(await provider.getBalance(account)));

      const tokenBal = await tokenContract.balanceOf(account);
      setTokenBalance(ethers.formatUnits(tokenBal, 18));
    } catch (err) {
      console.error("Unstaking error:", err);
      setError("Failed to unstake ETH");
    }
  };

  const claimRewards = async () => {
    try {
      setIsClaiming(true);
      const reward = await stakingContract.calculateReward(account);
      if (reward == 0n) {
        setError("No rewards available");
        return;
      }

      const tx = await stakingContract.claimReward();
      await tx.wait();

      const updatedReward = await stakingContract.calculateReward(account);
      setReward(ethers.formatUnits(updatedReward, 18));

      const tokenBal = await tokenContract.balanceOf(account);
      setTokenBalance(ethers.formatUnits(tokenBal, 18));
      setError("");
    } catch (err) {
      console.error("Claim rewards error:", err);
      setError("Failed to claim rewards");
    } finally {
      setIsClaiming(false);
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
          <div className="space-y-4 mt-4 ">
            <p>ETH Balance: {parseFloat(balance).toFixed(4)} ETH</p>
            <p>Staked: {parseFloat(stakedAmount).toFixed(4)} ETH</p>
            <p>Reward: {parseFloat(reward).toFixed(2)} FIT</p>
            <p>FIT Balance: {parseFloat(tokenBalance).toFixed(2)} FIT</p>
            <StakeForm
              stakeAmount={stakeAmount}
              setStakeAmount={setStakeAmount}
              stakeEth={stakeEth}
            />
            <UnstakeButton unstakeEth={unstakeEth} />
            <ClaimRewards claimRewards={claimRewards} isClaiming={isClaiming} />
            {error && (
              <p className="text-red-400 text-xs text-center">{error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
