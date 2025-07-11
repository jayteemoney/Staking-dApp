import { ethers } from "ethers";

// Centralized error messages for staking operations
const ERROR_MESSAGES = {
  INSUFFICIENT_BALANCE: "Insufficient ETH balance to complete the transaction.",
  USER_REJECTED: "Transaction rejected by user.",
  INVALID_AMOUNT: "Please enter a valid stake amount (greater than 0).",
  LOCK_PERIOD_NOT_ELAPSED: "Cannot unstake: Lock period has not elapsed.",
  NO_REWARDS: "No rewards available to claim.",
  STAKING_FAILED: "Failed to stake ETH. Please try again.",
  UNSTAKING_FAILED: "Failed to unstake ETH. Please try again.",
  CLAIM_FAILED: "Failed to claim rewards. Please try again.",
};

// Helper to format error messages
const formatError = (err, defaultMessage) => {
  if (err.message.includes("insufficient funds")) return ERROR_MESSAGES.INSUFFICIENT_BALANCE;
  if (err.code === 4001 || err.message.includes("user rejected")) return ERROR_MESSAGES.USER_REJECTED;
  if (err.message.includes("lock period not elapsed")) return ERROR_MESSAGES.LOCK_PERIOD_NOT_ELAPSED;
  if (err.message.includes("no rewards")) return ERROR_MESSAGES.NO_REWARDS;
  return defaultMessage;
};

// Stake ETH
export const stakeEth = async ({
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
}) => {
  try {
    if (!stakeAmount || isNaN(stakeAmount) || parseFloat(stakeAmount) <= 0) {
      setError(ERROR_MESSAGES.INVALID_AMOUNT);
      return false;
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
    return true;
  } catch (err) {
    console.error("Staking error:", err);
    setError(formatError(err, ERROR_MESSAGES.STAKING_FAILED));
    return false;
  }
};

// Unstake ETH
export const unstakeEth = async ({
  stakingContract,
  provider,
  account,
  setError,
  setStakedAmount,
  setBalance,
  setTokenBalance,
  tokenContract,
}) => {
  try {
    const tx = await stakingContract.unstake();
    await tx.wait();
    setError("");
    const stake = await stakingContract.stakes(account);
    setStakedAmount(ethers.formatEther(stake.amount));
    setBalance(ethers.formatEther(await provider.getBalance(account)));
    const tokenBal = await tokenContract.balanceOf(account);
    setTokenBalance(ethers.formatUnits(tokenBal, 18));
    return true;
  } catch (err) {
    console.error("Unstaking error:", err);
    setError(formatError(err, ERROR_MESSAGES.UNSTAKING_FAILED));
    return false;
  }
};

// Claim Rewards
export const claimRewards = async ({
  stakingContract,
  account,
  setError,
  setReward,
  setTokenBalance,
  tokenContract,
}) => {
  try {
    const userStake = await stakingContract.stakes(account);
    if (!userStake.active) {
      setError("No active stake.");
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    if (now < Number(userStake.timestamp) + 15) {
      setError("Lock period not completed.");
      return false;
    }

    const reward = await stakingContract.calculateReward(account);
    console.log("Reward to claim:", reward);

    if (reward === 0n) {
      setError(ERROR_MESSAGES.NO_REWARDS);
      return false;
    }

    const contractTokenBalance = await tokenContract.balanceOf(stakingContract.target);
    if (contractTokenBalance < reward) {
      setError("Staking contract has insufficient reward tokens.");
      return false;
    }

    const tx = await stakingContract.claimReward();
    await tx.wait();

    setError("");
    setReward(ethers.formatUnits(reward, 18));
    const tokenBal = await tokenContract.balanceOf(account);
    setTokenBalance(ethers.formatUnits(tokenBal, 18));
    return true;
  } catch (err) {
    console.error("Claim rewards error:", err);
    setError(formatError(err, ERROR_MESSAGES.CLAIM_FAILED));
    return false;
  }
};
