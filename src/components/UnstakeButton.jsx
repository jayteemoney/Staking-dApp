import { FaEthereum } from "react-icons/fa";

function UnstakeButton({ unstakeEth }) {
  return (
    <button
      onClick={unstakeEth}
      className="w-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
    >
      <FaEthereum className="mr-2" /> Unstake ETH
    </button>
  );
}

export default UnstakeButton;