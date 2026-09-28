// content/content-script.js
const RELAYABLE_TYPES = new Set(['canvas-fingerprint', 'window-tamper']);
const MAX_DETAIL_LENGTH = 64;
const KNOWN_SECOND_LEVEL_CCTLDS = new Set([
  'co.uk', 'com.br', 'com.au', 'co.jp', 'org.uk', 'net.br', 'gov.br',
]);

// Duplicado de background/trackers.js: content scripts não podem importar
// módulos ES do background — heurística de eTLD+1 mantida idêntica aqui.
function getRegistrableDomain(hostname) {
  const labels = hostname.split('.').filter(Boolean);
  if (labels.length <= 2) return hostname;
  const lastTwo = labels.slice(-2).join('.');
  if (KNOWN_SECOND_LEVEL_CCTLDS.has(lastTwo)) {
    return labels.slice(-3).join('.');
  }
  return lastTwo;
}

function sanitizeDetail(detail) {
  return typeof detail === 'string' ? detail.slice(0, MAX_DETAIL_LENGTH) : undefined;
}

function injectPageScript() {
  try {
    const script = document.createElement('script');
    script.src = browser.runtime.getURL('content/injected.js');
    script.onload = () => script.remove();
    // CSP que bloqueia o <script> injetado dispara 'error', não uma exceção
    // síncrona — precisa de handler dedicado para não reportar score "limpo".
    script.onerror = () => browser.runtime.sendMessage({ type: 'injection-failed' });
    (document.head || document.documentElement).appendChild(script);
  } catch (err) {
    browser.runtime.sendMessage({ type: 'injection-failed' });
  }
}

function isThirdPartyFrame() {
  if (window.top === window) return false;
  try {
    const frameDomain = getRegistrableDomain(new URL(window.location.href).hostname);
    const topDomain = getRegistrableDomain(new URL(window.top.location.href).hostname);
    return frameDomain !== topDomain;
  } catch {
    // acesso a window.top.location de origem diferente lança SecurityError —
    // a própria exceção já confirma que é um frame de terceira parte.
    return true;
  }
}

window.addEventListener('message', (event) => {
  if (event.source !== window || !event.data || event.data.source !== 'privacy-extension') return;
  const { type, detail } = event.data;

  if (type === 'storage-write') {
    if (isThirdPartyFrame()) {
      browser.runtime.sendMessage({ type, origin: window.location.hostname });
    }
    return;
  }

  if (!RELAYABLE_TYPES.has(type)) return;

  if (type === 'canvas-fingerprint') {
    const callerHostname = sanitizeDetail(detail);
    const thirdParty = callerHostname
      ? getRegistrableDomain(callerHostname) !== getRegistrableDomain(window.location.hostname)
      : isThirdPartyFrame();
    browser.runtime.sendMessage({ type, thirdParty });
    return;
  }

  browser.runtime.sendMessage({ type, thirdParty: isThirdPartyFrame(), detail: sanitizeDetail(detail) });
});

injectPageScript();
