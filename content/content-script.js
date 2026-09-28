// content/content-script.js
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
    return new URL(window.location.href).hostname !== new URL(window.top.location.href).hostname;
  } catch {
    // acesso a window.top.location de origem diferente lança SecurityError —
    // a própria exceção já confirma que é um frame de terceira parte.
    return true;
  }
}

function reportStorageUsage() {
  try {
    const hasLocalStorage = window.localStorage.length > 0;
    const hasSessionStorage = window.sessionStorage.length > 0;
    if ((hasLocalStorage || hasSessionStorage) && isThirdPartyFrame()) {
      browser.runtime.sendMessage({ type: 'storage-write', origin: window.location.hostname });
    }
  } catch {
    // storage pode lançar em contextos particionados/privados — ignorar
  }
  try {
    if (window.indexedDB && window.indexedDB.databases) {
      window.indexedDB.databases().then((dbs) => {
        if (dbs.length > 0 && isThirdPartyFrame()) {
          browser.runtime.sendMessage({ type: 'storage-write', origin: window.location.hostname });
        }
      });
    }
  } catch {
    // idem
  }
}

window.addEventListener('message', (event) => {
  if (event.source !== window || !event.data || event.data.source !== 'privacy-extension') return;
  browser.runtime.sendMessage({
    type: event.data.type,
    thirdParty: isThirdPartyFrame(),
    detail: event.data.detail,
  });
});

injectPageScript();
reportStorageUsage();
