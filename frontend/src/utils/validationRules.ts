import type { RuleObject } from 'antd/es/form';

export const noSpaceRule: RuleObject = {
  pattern: /^\S*$/,
  message: 'Không được chứa khoảng trắng',
};
