function UnstakeButton({ unstakeEth }) {
  return (
    <button
      onClick={unstakeEth}
      className="w-full bg-red-300 hover:bg-red-400 text-white py-2 px-4 rounded"
    >
      Unstake ETH
    </button>
  );
}

export default UnstakeButton;