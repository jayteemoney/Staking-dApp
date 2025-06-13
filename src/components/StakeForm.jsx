function StakeForm({ stakeAmount, setStakeAmount, stakeEth }) {
  return (
    <div className="space-y-2">
      <input
        type="number"
        value={stakeAmount}
        onChange={(e) => setStakeAmount(e.target.value)}
        placeholder="Enter ETH amount (min 0.01)"
        className="w-full bg-gray-700 text-white py-2 px-4 rounded"
        min="0.01"
        step="0.01"
      />
      <button
        onClick={stakeEth}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
      >
        Stake ETH
      </button>
    </div>
  );
}
export default StakeForm;