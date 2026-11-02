# Sobramar: frontend

Interface do **Sobramar**, que mostra quanto do futuro financeiro de uma pessoa já está comprometido e quanto sobra em cada mês. Angular 22.

O backend está em [sobramar-backend](https://github.com/RodrigoMuller0018/sobramar-backend).

A tela principal mostra um mês por vez como uma ilha em 3D: a receita define o tamanho, os compromissos são a altura da água e a terra seca é a sobra. Os números ficam sempre em texto, e a tela funciona sem a cena. Decisões em [docs/adr/0002](docs/adr/0002-ilha-3d-do-mes.md).

## O que já vem pronto

- **Angular 22 moderno:** standalone, zoneless, signals, `OnPush`, control flow (`@if`/`@for`), rotas com lazy loading.
- **Estrutura por feature:** `core/` (interceptor de erro, avisos, config), `features/<nome>/` (container, componentes de apresentação e data service) e `features/legal/`.
- **Erros úteis ao usuário:** o interceptor traduz o Problem Details do backend (`codigo`) para texto amigável. Falha de rede e 5xx viram aviso global; erro de campo aparece no próprio campo.
- **Sessão em cookies HttpOnly:** o front nunca lê token. Com a sessão vencida, renova uma vez, dividindo a mesma renovação entre chamadas paralelas.
- **Fontes hospedadas no próprio site:** nenhum pedido a terceiros ao abrir a tela.
- **Formulário reativo tipado** com as mesmas regras do backend, só para feedback rápido (o back continua decidindo).
- **Acessibilidade e LGPD:** link "Pular para o conteúdo", foco visível, região `aria-live` para avisos, cores com contraste AA, páginas-modelo de política de privacidade e termos de uso.
- **Testes:** Vitest + TestBed, `HttpTestingController` e verificação **axe-core** nos componentes.
- **Quality gate** no `npm run verify` e no GitHub Actions. Veja a tabela completa em [docs/adr/0001](docs/adr/0001-estrutura-e-quality-gate.md).

## Pré-requisitos

- Node.js 22 (≥ 22.22.3) ou 24 (≥ 24.15.0). A versão do CI está no `.nvmrc`.
- O [sobramar-backend](https://github.com/RodrigoMuller0018/sobramar-backend) rodando na porta 8080, com `SOBRAMAR_COOKIE_SEGURO=false` em `http://localhost`.

## Comandos

| Comando           | O que faz                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------- |
| `npm start`       | Sobe em `http://localhost:4200`. O `proxy.conf.json` encaminha `/api` para `localhost:8080` |
| `npm run verify`  | Roda **todo** o quality gate localmente, igual ao CI                                        |
| `npm run format`  | Formata o código no padrão (rode antes de commitar)                                         |
| `npm test`        | Testes em modo watch                                                                        |
| `npm run test:ci` | Testes uma vez, com cobertura (relatório em `coverage/`)                                    |
| `npm run lint`    | ESLint, incluindo as regras de acessibilidade de template                                   |

Para ver a tela com dados, crie a família fictícia do exemplo de referência numa conta local vazia:

```bash
SOBRAMAR_SEMENTE_EMAIL=... SOBRAMAR_SEMENTE_SENHA=... node scripts/semear-exemplo.mjs
```

O script só aceita API local e confere a sobra dos 12 meses no final.

## Conformidade web e LGPD

O que o modelo já cobre e o que fica para quando o projeto tiver usuários reais:

| Item                                                   | Situação no modelo                                                                                                                     |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Acessibilidade (WCAG AA), teclado, foco, labels        | ✅ Lint de acessibilidade + axe-core nos testes                                                                                        |
| Contraste                                              | ✅ Tokens de cor em `styles.scss` com contraste ≥ 4.5:1                                                                                |
| Formulário informa a finalidade e pede só o necessário | ✅ Só e-mail e senha no login; os cadastros chegam em outra etapa                                                                      |
| Política de privacidade e termos de uso                | ⚠️ Páginas-modelo: **revise** antes de publicar                                                                                        |
| Aviso de cookies e scripts de tracking                 | ⚠️ Só cookies necessários para a sessão, sem analytics. Se adicionar, banner com aceitar/recusar **antes** de carregar qualquer script |
| Canal do titular (acesso, correção, exclusão)          | ⚠️ Necessário quando houver usuários reais                                                                                             |
| Política de reembolso, dados da empresa (CNPJ)         | ⚠️ Só se o projeto vender algo                                                                                                         |

## Fluxo de trabalho

- Branches curtas: `feat/...`, `fix/...`, `chore/...`
- Commits no padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/) (`feat:`, `fix:`, `test:`...)
- Tudo entra na `main` via PR com o checklist do template preenchido e o CI verde
- Atualizações de versão principal do Angular com `ng update` (aplica as migrações), não pelo Dependabot
- Decisões relevantes viram um ADR em `docs/adr/`
