// background/bounce.js
import { getRegistrableDomain } from './trackers.js';

// Cadeias indexadas por requestId (não tabId): o mesmo requestId persiste
// por todos os saltos de UM redirect, então cadeias de requests diferentes
// nunca se misturam. Limpo em onCompleted/onErrorOccurred — vida útil
// limitada ao request em voo, sem crescimento ilimitado por aba.
const redirectChains = new Map();

// Sinal de bounce em navegação de frame principal chega antes do
// webNavigation.onCommitted que reseta o PageReport da página recém
// carregada — guardar aqui e aplicar no reset evita perder o sinal.
const pendingMainFrameBounce = new Map();

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

export function hasDistinctRegistrableDomains(chain) {
  const domains = new Set();
  for (const hop of chain) {
    try {
      domains.add(getRegistrableDomain(new URL(hop.url).hostname));
    } catch {
      // URL inválida não conta como domínio
    }
  }
  return domains.size >= 2;
}

export function detectBounce(chain) {
  if (chain.length < 2) return { detected: false };
  if (!hasDistinctRegistrableDomains(chain)) return { detected: false };
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

export function markPendingMainFrameBounce(tabId) {
  pendingMainFrameBounce.set(tabId, true);
}

export function consumePendingBounce(tabId) {
  const value = pendingMainFrameBounce.get(tabId) || false;
  pendingMainFrameBounce.delete(tabId);
  return value;
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

        const chain = redirectChains.get(details.requestId) || [];
        chain.push({ url: details.url });
        if (details.redirectUrl) chain.push({ url: details.redirectUrl });
        const trimmed = chain.slice(-6);
        redirectChains.set(details.requestId, trimmed);

        if (detectBounce(trimmed).detected) {
          if (details.type === 'main_frame') {
            markPendingMainFrameBounce(details.tabId);
          } else {
            getReport(details.tabId).bounceTrackingDetected = true;
          }
        }
      } catch (err) {
        console.error('bounce listener error', err);
      }
    },
    { urls: ['<all_urls>'] }
  );

  const cleanup = (details) => redirectChains.delete(details.requestId);
  browser.webRequest.onCompleted.addListener(cleanup, { urls: ['<all_urls>'] });
  browser.webRequest.onErrorOccurred.addListener(cleanup, { urls: ['<all_urls>'] });
}
