# Privacy Tracker Detector

Extensão Firefox (Manifest V2) para detecção de rastreadores, cookies,
fingerprinting, bounce tracking e indicadores de hijacking, com pontuação de
privacidade por página.

## Carregar no Firefox

1. Abrir `about:debugging#/runtime/this-firefox`.
2. Clicar em "Load Temporary Add-on".
3. Selecionar o arquivo `manifest.json` na raiz deste repositório.
4. O ícone da extensão aparece na barra de ferramentas; clicar nele abre o
   relatório da aba ativa.
5. Configurações → lista de bloqueio personalizada: clicar em "Configurar
   lista de bloqueio" na popup, ou `about:addons` → Privacy Tracker Detector
   → Preferences.

Recarregar a extensão em `about:debugging` após qualquer mudança de código
(não há hot-reload).

**Verificar manualmente em Firefox real, antes de escrever o relatório:**
detectores presos a `webRequest`/DOM (rastreadores, cookies, bounce tracking,
hijack, canvas fingerprint, injeção do script na página) não têm garantia de
se comportar de forma idêntica a um teste automatizado — em especial, a
injeção de `content/injected.js` via `moz-extension://` sob CSP restritiva
(`script-src 'self'`) deve ser conferida em `about:debugging`, já que o
comportamento de bloqueio de CSP para origem de extensão pode diferir do
comportamento para um `<script src>` de origem HTTP comum.

## Rodar os testes

```bash
npm test
```

Roda os testes de lógica pura (`scoring.js`, `trackers.js`, `cookies.js`,
`bounce.js`, `hijack-network.js`, `blocklist.js`, `options.js`, `state.js`)
com `node:test`. Detectores presos a APIs de browser (webRequest, DOM) foram
validados com Playwright como proxy (não Firefox real) durante o
desenvolvimento — confirmar em Firefox real antes de gerar as evidências do
relatório.

## Metodologia de pontuação de privacidade

Score inicia em 100, dedução por categoria, piso em 0
(`background/scoring.js`):

| Categoria | Fórmula | Dedução máx |
|---|---|---|
| Domínios 3ª parte | −1 por domínio único observado | −25 |
| Cookies 3ª parte persistentes | −2 por cookie único (sessão não conta) | −20 |
| Canvas fingerprint | −15 se script 3ª parte lê canvas; −8 se 1ª parte | −15 |
| Bounce tracking / cookie sync | −15 flat se detectado (binário) | −15 |
| Storage 3ª parte (local/session/IndexedDB) | −5 por origem 3ª parte única gravando, cap 2 ocorrências | −10 |
| Hijack/hook (WS 3º, tamper de builtins sensíveis, polling excessivo) | −15 flat se qualquer indicador presente | −15 |

`score = max(0, 100 - Σdeduções)`. Faixas: 90–100 ótimo, 70–89 bom, 40–69
preocupante, 0–39 ruim.

Justificativa dos pesos: contagem de domínios/cookies com teto evita que uma
única categoria domine o score; canvas, bounce/cookie-sync e hijack são
**flat** (não escalam com contagem) porque a presença já indica
comportamento deliberado/grave; 1ª vs 3ª parte em canvas diferencia
captcha/anti-fraude legítimo de fingerprint cross-site.

Divergência esperada vs. Blacklight (documentar no relatório): Blacklight
detecta categorias que este plugin não implementa (session recording,
keylogging de formulário, Facebook pixel específico) — o score do plugin
pode vir mais alto nesses casos por não enxergar esses sinais, não porque o
site seja mais limpo.

## Estrutura

- `background/` — lógica de detecção e scoring, roda no background script.
- `content/` — content script + script injetado no contexto da página.
- `ui/` — popup e página de opções.
- `tests/` — testes automatizados (`node:test`) e fixtures de teste manual.
- `evidencias/` — HAR e prints dos testes (DDG Privacy Test Pages + 3 sites
  reais).
