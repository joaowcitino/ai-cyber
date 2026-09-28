# Relatório — Privacy Tracker Detector

## 1. Execução no DuckDuckGo Privacy Test Pages

| Página testada | Resultado esperado (reportado pela página) | Resultado do plugin | Explicação da divergência |
|---|---|---|---|
| Tracker Reporting | | | |
| Storage blocking | | | |
| Fingerprinting/canvas | | | |
| Tracker Blocking | | | |
| Storage partitioning | | | |
| Bounce tracking | | | |
| Query parameters | | | |
| js-leaks | | | |

Cada linha deve vir acompanhada de print do plugin em execução na página
(anexar em `evidencias/ddg/`).

## 2. Análise de 3 sites reais

Sites sorteados por matrícula: _preencher quando a lista do professor for
divulgada_.

Para cada site:

### Site N — `<domínio>`

- HAR exportado do DevTools: `evidencias/sites/<domínio>.har`
- Rastreadores detectados pelo plugin: ...
- Rastreadores identificados pelo Blacklight (The Markup): ...
- Bloqueios do uBlock Origin: ...
- Reconciliação: cada rastreador que o Blacklight ou o uBlock identificaram
  e o plugin não (ou vice-versa) — explicação técnica referenciando o
  tráfego observado no HAR.

## 3. Pontuação de privacidade

| Site | Score do plugin | Faixa | Score/grade do Blacklight | Comparação crítica |
|---|---|---|---|---|
| | | | | |

Metodologia de score: ver `README.md` (seção "Metodologia de pontuação de
privacidade") — copiar a tabela de critérios/pesos para o PDF final
entregue.

Divergências esperadas vs. Blacklight (documentar concretamente por site):
Blacklight detecta categorias que este plugin não implementa (session
recording, keylogging de formulário, Facebook pixel específico) — nesses
casos o score do plugin tende a vir mais alto por não enxergar esses sinais,
não porque o site seja mais limpo.
