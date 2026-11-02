# template-frontend-angular

Modelo de frontend **Angular 22** com um quality gate que roda a cada PR. Clique em **Use this template** para criar um projeto novo já no padrão.

Par do [template-backend-spring](https://github.com/RodrigoMuller0018/template-backend-spring): a feature de exemplo consome a API de tarefas dele.

## O que já vem pronto

- **Angular 22 moderno:** standalone, zoneless, signals, `OnPush`, control flow (`@if`/`@for`), rotas com lazy loading.
- **Estrutura por feature:** `core/` (interceptor de erro, avisos, config), `features/<nome>/` (container, componentes de apresentação e data service) e `features/legal/`.
- **Erros úteis ao usuário:** o interceptor traduz o Problem Details do backend (`codigo`) para texto amigável. Falha de rede e 5xx viram aviso global; erro de campo aparece no próprio campo.
- **Formulário reativo tipado** com as mesmas regras do backend, só para feedback rápido (o back continua decidindo).
- **Acessibilidade e LGPD:** link "Pular para o conteúdo", foco visível, região `aria-live` para avisos, cores com contraste AA, páginas-modelo de política de privacidade e termos de uso.
- **Testes:** Vitest + TestBed, `HttpTestingController` e verificação **axe-core** nos componentes.
- **Quality gate** no `npm run verify` e no GitHub Actions. Veja a tabela completa em [docs/adr/0001](docs/adr/0001-estrutura-e-quality-gate.md).

## Pré-requisitos

- Node.js 22 (≥ 22.22.3) ou 24 (≥ 24.15.0). A versão do CI está no `.nvmrc`.
- Para usar a tela de tarefas, o [template-backend-spring](https://github.com/RodrigoMuller0018/template-backend-spring) rodando na porta 8080.

## Comandos

| Comando           | O que faz                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------- |
| `npm start`       | Sobe em `http://localhost:4200`. O `proxy.conf.json` encaminha `/api` para `localhost:8080` |
| `npm run verify`  | Roda **todo** o quality gate localmente, igual ao CI                                        |
| `npm run format`  | Formata o código no padrão (rode antes de commitar)                                         |
| `npm test`        | Testes em modo watch                                                                        |
| `npm run test:ci` | Testes uma vez, com cobertura (relatório em `coverage/`)                                    |
| `npm run lint`    | ESLint, incluindo as regras de acessibilidade de template                                   |

## Depois de criar um projeto a partir deste modelo

1. **Renomeie** o `name` no `package.json`, o projeto no `angular.json` (e o caminho do `lcov.info` no `ci.yml`) e o `<title>` do `src/index.html`.
2. **Apague a feature `tarefas`** quando criar a primeira feature real. Use-a como referência antes disso.
3. **Revise `features/legal/`:** os textos são modelos. Ajuste ao que o projeto realmente coleta (veja o checklist abaixo).
4. **Ligue o Dependency graph:** _Settings → Advanced Security → Dependabot alerts → Enable_ (liga o grafo junto). Sem ele, o check `Dependências vulneráveis` falha em todo PR.
5. **Proteja a `main`:** _Settings → Rules → Rulesets → New branch ruleset_, alvo `main`, marcando:
   - _Require a pull request before merging_
   - _Require status checks to pass_ → adicione `Build, testes e análise estática`, `Segredos no código` e `Dependências vulneráveis`
   - _Block force pushes_
6. **SonarQube Cloud (opcional, grátis em repositório público):**
   1. Entre em [sonarcloud.io](https://sonarcloud.io) com o GitHub e importe o repositório.
   2. Em _Settings → Secrets and variables → Actions_:
      - Secret `SONAR_TOKEN`: o token gerado no Sonar
      - Variables `SONAR_ORGANIZATION` e `SONAR_PROJECT_KEY`: os valores que o Sonar mostrar
   3. No Sonar, desative a _Automatic Analysis_ (a análise passa a vir do CI, com cobertura).

## Conformidade web e LGPD

O que o modelo já cobre e o que fica para quando o projeto tiver usuários reais:

| Item                                                   | Situação no modelo                                                                                              |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Acessibilidade (WCAG AA), teclado, foco, labels        | ✅ Lint de acessibilidade + axe-core nos testes                                                                 |
| Contraste                                              | ✅ Tokens de cor em `styles.scss` com contraste ≥ 4.5:1                                                         |
| Formulário informa a finalidade e pede só o necessário | ✅ Só o título da tarefa                                                                                        |
| Política de privacidade e termos de uso                | ⚠️ Páginas-modelo: **revise** antes de publicar                                                                 |
| Aviso de cookies e scripts de tracking                 | ⚠️ Não há cookies nem analytics. Se adicionar, banner com aceitar/recusar **antes** de carregar qualquer script |
| Canal do titular (acesso, correção, exclusão)          | ⚠️ Necessário quando houver usuários reais                                                                      |
| Política de reembolso, dados da empresa (CNPJ)         | ⚠️ Só se o projeto vender algo                                                                                  |

## Fluxo de trabalho

- Branches curtas: `feat/...`, `fix/...`, `chore/...`
- Commits no padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/) (`feat:`, `fix:`, `test:`...)
- Tudo entra na `main` via PR com o checklist do template preenchido e o CI verde
- Atualizações de versão principal do Angular com `ng update` (aplica as migrações), não pelo Dependabot
- Decisões relevantes viram um ADR em `docs/adr/`
