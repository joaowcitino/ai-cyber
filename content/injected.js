// content/injected.js
(function () {
  window.__privacyExtensionLoaded = true;

  function send(type, detail) {
    window.postMessage({ source: 'privacy-extension', type, detail }, '*');
  }

  const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
  CanvasRenderingContext2D.prototype.getImageData = function (...args) {
    send('canvas-fingerprint');
    return originalGetImageData.apply(this, args);
  };

  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL = function (...args) {
    send('canvas-fingerprint');
    return originalToDataURL.apply(this, args);
  };

  const originalToBlob = HTMLCanvasElement.prototype.toBlob;
  HTMLCanvasElement.prototype.toBlob = function (...args) {
    send('canvas-fingerprint');
    return originalToBlob.apply(this, args);
  };

  const knownGlobals = new Set(Object.keys(window));
  setTimeout(() => {
    for (const key of Object.keys(window)) {
      if (!knownGlobals.has(key)) {
        send('window-tamper', key);
        break;
      }
    }
  }, 2000);
})();
