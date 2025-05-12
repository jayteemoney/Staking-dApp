function ClaimRewards({ claimRewards }) {
  return (
    <button
      onClick={claimRewards}
      className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded"
    >
      Claim Rewards
    </button>
  );
}

export default ClaimRewards;