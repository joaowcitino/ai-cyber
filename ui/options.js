// ui/options.js
export function sanitizeBlocklist(raw) {
  return raw
    .split('\n')
    .map((line) => line.trim().toLowerCase())
    .filter((line) => line.length > 0 && /^[a-z0-9.-]+\.[a-z]{2,}$/.test(line));
}

async function loadBlocklist() {
  const data = await browser.storage.local.get('blocklist');
  document.getElementById('blocklist').value = (data.blocklist || []).join('\n');
}

async function saveBlocklist() {
  const raw = document.getElementById('blocklist').value;
  const blocklist = sanitizeBlocklist(raw);
  await browser.storage.local.set({ blocklist });
  document.getElementById('status').textContent = `Salvo: ${blocklist.length} domínio(s).`;
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', loadBlocklist);
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('save').addEventListener('click', saveBlocklist);
  });
}
