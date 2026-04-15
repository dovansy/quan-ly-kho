import { FiEye, FiEyeOff } from 'react-icons/fi';

const SuffixPass = ({ isVisible }: { isVisible: boolean }) => {
  return isVisible ? (
    <FiEye className="text-gray-400 hover:text-gray-600 transition-colors" />
  ) : (
    <FiEyeOff className="text-gray-400 hover:text-gray-600 transition-colors" />
  );
};

export default SuffixPass;
