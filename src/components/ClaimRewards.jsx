function ClaimRewards({ claimRewards, isClaiming }) {
  return (
    <button
      onClick={claimRewards}
      className={`w-full ${
        isClaiming
          ? "bg-yellow-400 text-gray-900 cursor-wait"
          : "bg-yellow-600 hover:bg-yellow-600"
      } text-white py-2 px-4 rounded`}
      disabled={isClaiming}
    >
      {isClaiming ? "Claiming..." : "Claim Rewards"}
    </button>
  );
}
export default ClaimRewards;