// Device sniffing for mobile

const isIOS = () =>
  navigator.userAgent.match(/iPad|iPhone|iPod/) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const isMobile = {
  android: () => navigator.userAgent.match(/Android/i),
  blackberry: () => navigator.userAgent.match(/BlackBerry/i),
  ios: isIOS,
  opera: () => navigator.userAgent.match(/Opera Mini/i),
  windows: () => navigator.userAgent.match(/IEMobile/i),
  any: () =>
    isIOS() ||
    isMobile.android() ||
    isMobile.blackberry() ||
    isMobile.opera() ||
    isMobile.windows(),
};

export default isMobile;
