function UnstakeButton({ unstakeEth }) {
  return (
    <button
      onClick={unstakeEth}
      className="w-full bg-red-600 hover:bg-blue-800 text-white py-2 px-4 rounded"
    >
      Unstake ETH
    </button>
  );
}

export default UnstakeButton;