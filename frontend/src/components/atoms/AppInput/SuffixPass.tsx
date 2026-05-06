import { FiEye, FiEyeOff } from 'react-icons/fi';

const SuffixPass = ({ isVisible }: { isVisible: boolean }) => {
  return isVisible ? (
    <FiEye className="text-gray-400 transition-colors hover:text-gray-600" />
  ) : (
    <FiEyeOff className="text-gray-400 transition-colors hover:text-gray-600" />
  );
};

export default SuffixPass;
