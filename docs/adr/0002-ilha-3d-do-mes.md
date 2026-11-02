# ADR 0002: Ilha 3D como visão principal do mês

- **Status:** aceito
- **Data:** 2026-11-02

## Contexto

A tela principal mostra um mês por vez, em 3D e interativa. O protótipo aprovado rodou a 60 quadros por segundo num Redmi. Os dados vêm da API, e a regra de cálculo fica só no backend.

## Decisão

- **Three.js** carregado sob demanda, depois do texto da tela. Fica num bundle próprio, atrás da interface `MotorDaIlha`.
- **Modelos gerados por código**, sem arquivos 3D por enquanto. Trocar por modelos feitos à mão fica para depois, com licença clara.
- **O texto é a verdade.** O número exato, a tabela do mês e os botões de cada lugar ficam fora do canvas. A tela funciona sem WebGL e com a cena desligada.
- **A cena só desenha.** A área seca segue a fórmula H(1 − ρ²), com a água em H × compromissos/receitas. A escala entre os meses usa a maior receita do período carregado.
- **Lugares por tipo de item, não por nome.** Receitas, cartão, contas, contas estimadas, boletos parcelados, gastos avulsos e vale. O item não informa a forma do compromisso, então eventos como IPVA aparecem em contas.
- **Fontes hospedadas com o site**, por `@fontsource`, sem pedidos a terceiros.

## Consequências

- A pasta `ilha/cena` fica fora da cobertura de testes, porque o jsdom não tem WebGL. A regra testável fica em `dominio/ilha-do-mes.ts`, e a cena é conferida no navegador.
- O desempenho precisa ser medido em aparelho real. A cena reduz a própria qualidade abaixo de 34 quadros por segundo.
- Um novo item que precise de lugar próprio exige mudar `lugarDoItem` e o `Diorama`.
