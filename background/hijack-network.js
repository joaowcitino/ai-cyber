// background/hijack-network.js
import { isThirdParty } from './trackers.js';

const requestTimestamps = new Map();

export function isWebSocketRequest(url) {
  return url.startsWith('ws://') || url.startsWith('wss://');
}

export function detectExcessivePolling(timestamps, windowMs = 10000, threshold = 8) {
  if (timestamps.length === 0) return false;
  const latest = timestamps[timestamps.length - 1];
  const recent = timestamps.filter((t) => t >= latest - windowMs);
  return recent.length >= threshold;
}

export function registerHijackListener(getReport) {
  browser.webRequest.onBeforeRequest.addListener(
    (details) => {
      try {
        if (details.tabId < 0) return;
        const initiator = details.initiator || details.originUrl;

        if (isWebSocketRequest(details.url) && initiator && isThirdParty(details.url, initiator)) {
          getReport(details.tabId).hijackIndicators.add('websocket-third-party');
        }

        const key = `${details.tabId}|${details.url}`;
        const timestamps = requestTimestamps.get(key) || [];
        timestamps.push(details.timeStamp);
        requestTimestamps.set(key, timestamps.slice(-20));
        if (detectExcessivePolling(requestTimestamps.get(key))) {
          getReport(details.tabId).hijackIndicators.add('excessive-polling');
        }
      } catch (err) {
        console.error('hijack listener error', err);
      }
    },
    { urls: ['<all_urls>'] }
  );
}
