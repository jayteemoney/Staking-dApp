function UnstakeButton({ unstakeEth }) {
  return (
    <button
      onClick={unstakeEth}
      className="w-full bg-red-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
    >
      Unstake ETH
    </button>
  );
}

export default UnstakeButton;