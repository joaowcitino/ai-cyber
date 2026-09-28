// background/cookies.js
import { getRegistrableDomain } from './trackers.js';

function normalizeDomain(domain) {
  return domain.startsWith('.') ? domain.slice(1) : domain;
}

export function classifyCookie(cookie, pageDomain) {
  const cookieRoot = getRegistrableDomain(normalizeDomain(cookie.domain));
  const pageRoot = getRegistrableDomain(normalizeDomain(pageDomain));
  return {
    ownership: cookieRoot === pageRoot ? 'first' : 'third',
    lifetime: cookie.expirationDate ? 'persistent' : 'session',
  };
}

export function parseSetCookieHeader(headerValue, requestHostname) {
  const parts = headerValue.split(';').map((p) => p.trim());
  const nameValue = parts[0] || '';
  const eqIdx = nameValue.indexOf('=');
  const name = eqIdx === -1 ? nameValue : nameValue.slice(0, eqIdx);
  let domain = requestHostname;
  let expirationDate;
  for (const part of parts.slice(1)) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim().toLowerCase();
    const value = part.slice(eq + 1).trim();
    if (key === 'domain' && value) domain = value;
    if (key === 'max-age' && value && !Number.isNaN(Number(value))) {
      expirationDate = Date.now() / 1000 + Number(value);
    }
    if (key === 'expires' && value) {
      const parsed = Date.parse(value);
      if (!Number.isNaN(parsed)) expirationDate = parsed / 1000;
    }
  }
  return { name, domain, expirationDate };
}

export function extractSetCookieHeaders(responseHeaders) {
  return (responseHeaders || [])
    .filter((h) => h.name.toLowerCase() === 'set-cookie' && h.value)
    .map((h) => h.value);
}

// onHeadersReceived carrega o tabId da requisição que setou o cookie —
// atribuir cookies a partir de cookies.onChanged + tabs.query({}) misturaria
// cookies de uma aba no relatório de outra, já que a API cookies não indica
// qual aba disparou a mudança.
export function registerCookieListener(getReport) {
  browser.webRequest.onHeadersReceived.addListener(
    (details) => {
      try {
        if (details.tabId < 0) return;
        const setCookieHeaders = extractSetCookieHeaders(details.responseHeaders);
        if (setCookieHeaders.length === 0) return;

        let requestHostname;
        try {
          requestHostname = new URL(details.url).hostname;
        } catch {
          return;
        }

        browser.tabs
          .get(details.tabId)
          .then((tab) => {
            if (!tab.url) return;
            let pageDomain;
            try {
              pageDomain = new URL(tab.url).hostname;
            } catch {
              return;
            }
            for (const headerValue of setCookieHeaders) {
              const cookie = parseSetCookieHeader(headerValue, requestHostname);
              const { ownership, lifetime } = classifyCookie(cookie, pageDomain);
              if (ownership === 'third' && lifetime === 'persistent') {
                getReport(details.tabId).thirdPartyPersistentCookies.add(`${cookie.domain}|${cookie.name}`);
              }
            }
          })
          .catch((err) => console.error('cookies listener: tabs.get failed', err));
      } catch (err) {
        console.error('cookies listener error', err);
      }
    },
    { urls: ['<all_urls>'] },
    ['responseHeaders']
  );
}
