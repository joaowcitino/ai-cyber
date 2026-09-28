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

## Rodar os testes

```bash
npm test
```

Roda os testes de lógica pura (`scoring.js`, `trackers.js`, `cookies.js`,
`bounce.js`, `hijack-network.js`, `blocklist.js`, `options.js`, `state.js`)
com `node:test`. Detectores presos a APIs de browser (webRequest, DOM) são
validados manualmente — ver passos de "Verificação manual" no plano de
implementação.

## Estrutura

- `background/` — lógica de detecção e scoring, roda no background script.
- `content/` — content script + script injetado no contexto da página.
- `ui/` — popup e página de opções.
- `tests/` — testes automatizados (`node:test`) e fixtures de teste manual.
- `evidencias/` — HAR e prints dos testes (DDG Privacy Test Pages + 3 sites
  reais).
