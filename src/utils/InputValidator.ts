export const validateCreateVirtualHumanInput = (input: any) => {
  if (!input || typeof input !== 'object') {
     throw new Error('Invalid input');
  }
  if (!input.name || input.name.trim().length === 0) {
    throw new Error('请输入虚拟人名称');
  }
  return input;
};
