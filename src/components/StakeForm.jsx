function StakeForm({ stakeAmount, setStakeAmount, stakeEth }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    stakeEth();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="text"
        value={stakeAmount}
        onChange={(e) => setStakeAmount(e.target.value)}
        placeholder="Amount to stake (ETH)"
        className="w-full p-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
      />
      <button
        type="submit"
        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
      >
        Stake ETH
      </button>
    </form>
  );
}

export default StakeForm;