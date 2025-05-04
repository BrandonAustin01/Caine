let isLocked = false;

module.exports = {
  enable: () => {
    isLocked = true;
  },
  disable: () => {
    isLocked = false;
  },
  status: () => isLocked,
};
