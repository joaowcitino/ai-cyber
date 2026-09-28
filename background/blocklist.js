// background/blocklist.js
export function matchesBlocklist(url, blocklist) {
  try {
    const hostname = new URL(url).hostname;
    return blocklist.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

// Cache em memória sincronizado com storage.local: o listener de bloqueio
// precisa responder de forma síncrona ({cancel}), então não dá pra consultar
// storage.local (assíncrono) dentro do próprio onBeforeRequest.
let cachedBlocklist = [];

function refreshCache() {
  browser.storage.local.get('blocklist').then((data) => {
    cachedBlocklist = data.blocklist || [];
  });
}

export function registerBlocklistListener() {
  refreshCache();
  browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.blocklist) {
      cachedBlocklist = changes.blocklist.newValue || [];
    }
  });
  browser.webRequest.onBeforeRequest.addListener(
    (details) => ({ cancel: matchesBlocklist(details.url, cachedBlocklist) }),
    { urls: ['<all_urls>'] },
    ['blocking']
  );
}
