import { FaGift } from "react-icons/fa";

function ClaimRewards({ claimRewards }) {
  return (
    <button
      onClick={claimRewards}
      className="w-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded"
    >
      <FaGift className="mr-2" /> Claim Rewards
    </button>
  );
}

export default ClaimRewards;