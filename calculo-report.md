# Lógica de Cálculo — Simulador DirectCon

> Extraído do arquivo `DirectCon — Simulador de Consórcio.html`

---

## Inputs principais

| Campo | ID no HTML | Descrição | Limites |
|---|---|---|---|
| Crédito | `r-credito` / `d-credito` | Valor do crédito desejado (R$) | — |
| Prazo | `r-prazo` / `d-prazo` | Prazo em meses | Imóvel: 100–240 / Veículo: 24–100 |
| Taxa de Administração | `r-taxa-adm` | % cobrada pela administradora | 9% a 30% |
| Fundo de Reserva | `r-fundo-adm` | % do fundo de reserva do grupo | 0% a 5% |
| Redutor | `r-redutor` / `d-redutor` | % de desconto na parcela pré-contemplação | 0% a 50% |
| Estratégia | `r-spill-*` / `d-spill-*` | Forma de contemplação escolhida | Sorteio / Lance Livre / Lance Embutido / Lance Fixo |
| Base do Lance | `lanceBaseR` / `lanceBaseD` | Base de cálculo do lance | `credito` ou `categoria` (totalBruto) |

---

## Fórmulas centrais — `computeCore`

```
totalBruto     = credito × (1 + (taxa_adm + fundo_reserva) / 100)
parcelaCheia   = totalBruto / prazo
total          = totalBruto − lanceEmbutido
parcelaReduzida = parcelaCheia × (1 − redutor / 100)
```

**Observação:** `total` é a base para os cenários pós-contemplação (já descontado o lance embutido). `totalBruto` é a base da `parcelaCheia`.

---

## Cálculo de Lance — `computeLance`

A base de cálculo pode ser o `credito` ou o `totalBruto` (categoria), conforme seleção do usuário.

| Estratégia | Lance Embutido | Lance Livre | Crédito Líquido |
|---|---|---|---|
| Sorteio | 0 | 0 | = credito |
| Lance Livre | 0 | base × llPct% | = credito |
| Lance Embutido | base × lePct% | base × leLLPct% | credito − lanceEmbutido |
| Lance Fixo | base × lfEmbPct% | base × lfRPPct% | credito − lanceEmbutido |

```
totalLance    = lanceEmbutido + lanceLivre
totalLancePct = (totalLance / credito) × 100
```

---

## Cenários Pós-Contemplação — `computeScenarios`

Para cada ponto de contemplação estimado (benchmarks internos do simulador):

```
paid        = parcelaReduzida × mesContemplação
saldo       = max(total − paid − lanceLivre, 0)
prazoRest   = prazo − mesContemplação
parcelaPós  = saldo / prazoRest
```

Se `mesContemplação >= prazo`, o cenário é marcado como `na` (prazo insuficiente).

---

## Administradoras Cadastradas

| Administradora | Taxa Imóvel | Fundo Imóvel | Taxa Veículo | Fundo Veículo | Modalidades | Destaque |
|---|---|---|---|---|---|---|
| Servopa | 21% | 2% | 16% | 1,5% | Sorteio, Lance Livre, Lance Embutido | Forte presença Sul/Sudeste |
| Santander | 22% | 2% | 17% | 1,5% | Sorteio, Lance Livre, Lance Embutido, **Lance Fixo 25%** | Ampla rede |
| Itaú | 21,5% | 2% | 16,5% | 1,5% | Sorteio, Lance Livre, Lance Embutido | Solidez e tradição |
| CNP | 20% | 2% | 15% | 1,5% | Sorteio, Lance Livre, Lance Embutido | Taxas competitivas |
| Banco do Brasil | 22% | 2% | 17% | 1,5% | Sorteio, Lance Livre, Lance Embutido, **Lance Fixo 30%** | Maior rede |
| Porto Seguro | 20,5% | 2% | 15,5% | 1,5% | Sorteio, Lance Livre, Lance Embutido | Excelente custo-benefício |
| Mycon | 19% | 2% | 14% | 1,5% | Sorteio, Lance Livre, Lance Embutido | 100% digital · Taxas baixas |
| Âncora | 20% | 2% | 15% | 1,5% | Sorteio, Lance Livre, Lance Embutido | Especialista em lance |

---

## Faixas de Taxa por Prazo (Config padrão — Imóvel)

| Faixa de Prazo | Taxa Adm. | Fundo |
|---|---|---|
| 200–240 meses | 22% | 2% |
| 150–199 meses | 18,5% | 2% |
| 120–149 meses | 17% | 2% |
| 60–119 meses | 16% | 2% |

### Veículo

| Faixa de Prazo | Taxa Adm. | Fundo |
|---|---|---|
| 72–100 meses | 17% | 1,5% |
| 48–71 meses | 14% | 1,5% |
| 24–47 meses | 12% | 1,5% |

---

## Consultores Cadastrados

- Bruno Vieira
- Gabriel Lopes
- Luan Geffer
- Luis Fellipe
- Pablo Camparim
- Shaquille Oniel
- Victor Tessaro

---

## Observações Gerais

- O simulador **não aplica correção de índice** (INCC, IPCA, IGP-M). As projeções são nominais.
- A contemplação por sorteio ou lance **não tem data garantida**.
- Seguro prestamista é obrigatório após a contemplação.
- Integração HubSpot prevista via `window.DIRECTCON.hubspot.submit(fields)` — campos marcados com `data-hs-field` no HTML.
- O botão "Gerar PDF" dispara `window.DIRECTCON.hubspot.onGeneratePDF(modo)`.
