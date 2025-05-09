import { FaEthereum } from "react-icons/fa";

function StakeForm({ stakeAmount, setStakeAmount, stakeEth }) {
  return (
    <div className="space-y-2">
      <input
        type="number"
        value={stakeAmount}
        onChange={(e) => setStakeAmount(e.target.value)}
        placeholder="Amount to stake (ETH)"
        className="w-full p-2 rounded bg-gray-700 text-white"
      />
      <button
        onClick={stakeEth}
        className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
      >
        <FaEthereum className="mr-2" /> Stake ETH
      </button>
    </div>
  );
}

export default StakeForm;