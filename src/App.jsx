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

  const connectWallet = async () => {
    console.log("Connect Wallet button clicked");
    console.log("window.ethereum available:", !!window.ethereum);
    console.log("ethers available:", !!ethers, ethers.version);
    if (typeof window.ethereum === "undefined" || !window.ethereum) {
      setError("Please install MetaMask");
      window.open("https://metamask.io", "_blank");
      console.error("MetaMask not detected");
      setIsConnecting(false);
      return;
    }
    if (!ethers) {
      setError("Ethers.js not loaded. Refresh the page.");
      console.error("Ethers.js not available");
      setIsConnecting(false);
      return;
    }
    setIsConnecting(true);
    try {
      console.log("Requesting MetaMask accounts...");
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      console.log("Current accounts:", accounts);
      if (accounts.length === 0) {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        console.log("Accounts requested successfully");
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      console.log("Network detected:", network);
      if (network.chainId !== BigInt(11155111)) {
        console.log("Switching to Sepolia...");
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0xaa36a7" }],
          });
          console.log("Switched to Sepolia");
        } catch (switchError) {
          setError("Failed to switch to Sepolia");
          console.error("Network switch error:", switchError);
          setIsConnecting(false);
          return;
        }
      }
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      console.log("Connected address:", address);
      setProvider(provider);
      setAccount(address);

      // Validate contract addresses
      console.log("FITTECH_TOKEN_ADDRESS:", FITTECH_TOKEN_ADDRESS);
      console.log("ETH_STAKING_ADDRESS:", ETH_STAKING_ADDRESS);
      if (!ethers.isAddress(FITTECH_TOKEN_ADDRESS)) {
        throw new Error("Invalid FITTECH_TOKEN_ADDRESS: " + FITTECH_TOKEN_ADDRESS);
      }
      if (!ethers.isAddress(ETH_STAKING_ADDRESS)) {
        throw new Error("Invalid ETH_STAKING_ADDRESS: " + ETH_STAKING_ADDRESS);
      }

      const staking = new ethers.Contract(
        ETH_STAKING_ADDRESS,
        EthStakingABI,
        signer
      );
      setStakingContract(staking);

      const token = new ethers.Contract(
        FITTECH_TOKEN_ADDRESS,
        FitechTokenABI,
        signer
      );
      setTokenContract(token);

      const balance = await provider.getBalance(address);
      setBalance(ethers.formatEther(balance));
      const stake = await staking.stakes(address);
      setStakedAmount(ethers.formatEther(stake.amount));
      const reward = await stakingContract.calculateReward(address);
      setReward(ethers.formatUnits(reward, 18));
      const tokenBal = await token.balanceOf(address);
      setTokenBalance(ethers.formatUnits(tokenBal, 18));
    } catch (err) {
      console.error("Connection error:", err);
      if (err.code === 4001) {
        setError("Connection rejected");
      } else if (err.code === -32002) {
        setError("MetaMask is processing a request");
      } else if (err.message.includes("Invalid FITTECH_TOKEN_ADDRESS")) {
        setError("Invalid token address");
      } else if (err.message.includes("Invalid ETH_STAKING_ADDRESS")) {
        setError("Invalid staking address");
      } else {
        setError("Failed to connect wallet");
      }
    } finally {
      console.log("Connection attempt completed");
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
      if (err.message.includes("Insufficient balance")) {
        setError("Insufficient ETH balance");
      } else if (err.message.includes("user rejected")) {
        setError("Transaction rejected");
      } else {
        setError("Failed to stake ETH");
      }
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
      if (err.message.includes("lock period not elapsed")) {
        setError("Lock period not elapsed");
      } else if (err.message.includes("user rejected")) {
        setError("Transaction rejected");
      } else {
        setError("Failed to unstake ETH");
      }
    }
  };

  const claimRewards = async () => {
    try {
      const tx = await stakingContract.claimReward();
      await tx.wait();
      setError("");
      const reward = await stakingContract.calculateReward(account);
      setReward(ethers.formatUnits(reward, 18));
      const tokenBal = await tokenContract.balanceOf(account);
      setTokenBalance(ethers.formatUnits(tokenBal, 18));
    } catch (err) {
      console.error("Claim rewards error:", err);
      if (err.message.includes("no rewards")) {
        setError("No rewards available");
      } else if (err.message.includes("user rejected")) {
        setError("Transaction rejected");
      } else {
        setError("Failed to claim rewards");
      }
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", () => {
        console.log("Accounts changed");
        connectWallet();
      });
      window.ethereum.on("chainChanged", () => {
        console.log("Chain changed");
        window.location.reload();
      });
      return () => {
        window.ethereum.removeAllListeners();
      };
    }
  }, );

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 text-center">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Stake <i>ETH</i> get <i>FITECHTOKENS</i></h1>
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
            <ClaimRewards claimRewards={claimRewards} />
            {error && (
              <p className="text-red-800 text-xs text-center">{error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;