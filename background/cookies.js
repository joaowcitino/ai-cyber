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

export function registerCookieListener(getReport) {
  browser.cookies.onChanged.addListener(async (changeInfo) => {
    if (changeInfo.removed) return;
    const cookie = changeInfo.cookie;
    let tabs;
    try {
      tabs = await browser.tabs.query({});
    } catch (err) {
      console.error('cookies listener: tabs.query failed', err);
      return;
    }
    for (const tab of tabs) {
      if (!tab.url) continue;
      let pageDomain;
      try {
        pageDomain = new URL(tab.url).hostname;
      } catch {
        continue;
      }
      const { ownership, lifetime } = classifyCookie(cookie, pageDomain);
      if (ownership === 'third' && lifetime === 'persistent') {
        getReport(tab.id).thirdPartyPersistentCookies.add(`${cookie.domain}|${cookie.name}`);
      }
    }
  });
}
