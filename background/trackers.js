// background/trackers.js
// Heurística de eTLD+1 sem lista pública completa (PSL) — suficiente para o
// escopo do projeto; ccSLDs comuns tratados explicitamente.
const KNOWN_SECOND_LEVEL_CCTLDS = new Set([
  'co.uk', 'com.br', 'com.au', 'co.jp', 'org.uk', 'net.br', 'gov.br',
]);

export function getRegistrableDomain(hostname) {
  const labels = hostname.split('.').filter(Boolean);
  if (labels.length <= 2) return hostname;
  const lastTwo = labels.slice(-2).join('.');
  if (KNOWN_SECOND_LEVEL_CCTLDS.has(lastTwo)) {
    return labels.slice(-3).join('.');
  }
  return lastTwo;
}

export function isThirdParty(requestUrl, initiatorUrl) {
  if (!initiatorUrl) return false;
  try {
    const requestHost = new URL(requestUrl).hostname;
    const initiatorHost = new URL(initiatorUrl).hostname;
    return getRegistrableDomain(requestHost) !== getRegistrableDomain(initiatorHost);
  } catch {
    return false;
  }
}

export function registerTrackerListener(getReport) {
  browser.webRequest.onBeforeRequest.addListener(
    (details) => {
      try {
        if (details.tabId < 0) return;
        const initiator = details.initiator || details.originUrl;
        if (!initiator) return;
        if (isThirdParty(details.url, initiator)) {
          const domain = getRegistrableDomain(new URL(details.url).hostname);
          getReport(details.tabId).thirdPartyDomains.add(domain);
        }
      } catch (err) {
        console.error('trackers listener error', err);
      }
    },
    { urls: ['<all_urls>'] }
  );
}
