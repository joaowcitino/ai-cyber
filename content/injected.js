// content/injected.js
(function () {
  window.__privacyExtensionLoaded = true;

  // Referência capturada cedo: um script da página que sobrescreve
  // window.postMessage depois disso não consegue mais suprimir nossos envios.
  const postMessage = window.postMessage.bind(window);

  function send(type, detail) {
    postMessage({ source: 'privacy-extension', type, detail }, '*');
  }

  // Capturado uma vez, de forma síncrona, no carregamento do próprio script
  // (document.currentScript só é válido durante a execução síncrona inicial,
  // não mais tarde quando um hook dispara de forma assíncrona).
  const ownScriptHostname = (() => {
    try {
      return document.currentScript ? new URL(document.currentScript.src).hostname : null;
    } catch {
      return null;
    }
  })();

  // O stack tem 1+ frames do próprio script injetado antes do frame de quem
  // de fato chamou a API do canvas — em vez de pular um número fixo de
  // frames (frágil: varia conforme a função de hook é escrita), descarta
  // qualquer frame cuja URL bata com a do próprio script injetado e usa o
  // primeiro frame restante, de qualquer esquema (http(s) ou moz-extension:).
  function getCallerHostname() {
    try {
      const stack = new Error().stack || '';
      const matches = stack.match(/[a-z][a-z0-9+.-]*:\/\/[^\s)]+/gi) || [];
      for (const match of matches) {
        try {
          const hostname = new URL(match).hostname;
          if (hostname && hostname !== ownScriptHostname) return hostname;
        } catch {
          continue;
        }
      }
    } catch {
      // stack trace indisponível — deixa o content-script cair pro fallback
      // de atribuição por frame (isThirdPartyFrame)
    }
    return null;
  }

  const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
  CanvasRenderingContext2D.prototype.getImageData = function (...args) {
    send('canvas-fingerprint', getCallerHostname());
    return originalGetImageData.apply(this, args);
  };

  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL = function (...args) {
    send('canvas-fingerprint', getCallerHostname());
    return originalToDataURL.apply(this, args);
  };

  const originalToBlob = HTMLCanvasElement.prototype.toBlob;
  HTMLCanvasElement.prototype.toBlob = function (...args) {
    send('canvas-fingerprint', getCallerHostname());
    return originalToBlob.apply(this, args);
  };

  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (...args) {
    send('storage-write');
    return originalSetItem.apply(this, args);
  };

  if (window.indexedDB && window.indexedDB.open) {
    const originalIDBOpen = window.indexedDB.open;
    window.indexedDB.open = function (...args) {
      send('storage-write');
      return originalIDBOpen.apply(this, args);
    };
  }

  // "Qualquer global novo" disparava em quase toda página (dataLayer, gtag,
  // jQuery, chunks de webpack). Em vez disso, guarda a identidade de um
  // conjunto pequeno de built-ins sensíveis e só sinaliza se ELES forem
  // substituídos — sinal de hijack muito mais raro e específico.
  function snapshotSensitiveRefs() {
    return {
      fetch: window.fetch,
      XHRopen: window.XMLHttpRequest && window.XMLHttpRequest.prototype.open,
      XHRsend: window.XMLHttpRequest && window.XMLHttpRequest.prototype.send,
      WebSocket: window.WebSocket,
      addEventListener: window.EventTarget && window.EventTarget.prototype.addEventListener,
      sendBeacon: window.navigator && window.navigator.sendBeacon,
    };
  }

  const initialRefs = snapshotSensitiveRefs();
  setTimeout(() => {
    const currentRefs = snapshotSensitiveRefs();
    for (const key of Object.keys(initialRefs)) {
      if (currentRefs[key] !== initialRefs[key]) {
        send('window-tamper', key);
        break;
      }
    }
  }, 2000);
})();
