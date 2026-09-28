// background/bounce.js
const redirectChains = new Map();

export function extractTrackingParams(url) {
  try {
    const params = new URL(url).searchParams;
    const result = {};
    for (const [key, value] of params.entries()) {
      if (value.length >= 8) result[key] = value;
    }
    return result;
  } catch {
    return {};
  }
}

export function detectBounce(chain) {
  if (chain.length < 2) return { detected: false };
  const allParams = chain.map((hop) => extractTrackingParams(hop.url));
  const firstParams = allParams[0];
  for (const value of Object.values(firstParams)) {
    const sharedAcrossHops = allParams.every((params) => Object.values(params).includes(value));
    if (sharedAcrossHops) return { detected: true };
  }
  return { detected: false };
}

export function hasInitiator(details) {
  return Boolean(details.initiator || details.originUrl);
}

export function registerBounceListener(getReport) {
  browser.webRequest.onBeforeRedirect.addListener(
    (details) => {
      try {
        if (details.tabId < 0) return;

        if (!hasInitiator(details)) {
          getReport(details.tabId).bounceTrackingIndeterminate = true;
          return;
        }

        const chain = redirectChains.get(details.tabId) || [];
        chain.push({ url: details.url });
        if (details.redirectUrl) chain.push({ url: details.redirectUrl });
        const trimmed = chain.slice(-6);
        redirectChains.set(details.tabId, trimmed);

        if (detectBounce(trimmed).detected) {
          getReport(details.tabId).bounceTrackingDetected = true;
        }
      } catch (err) {
        console.error('bounce listener error', err);
      }
    },
    { urls: ['<all_urls>'] }
  );
}
