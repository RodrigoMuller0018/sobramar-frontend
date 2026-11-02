# ADR 0001: Estrutura do projeto e quality gate

- **Status:** aceito
- **Data:** 2026-11-02

## Contexto

Este repositório é o modelo para todo frontend novo, em repositório separado do backend. Precisa nascer no padrão atual do Angular, acessível e com validação automática que impeça código fora do padrão de entrar na `main`, sem custo de ferramentas.

## Decisão

- **Stack:** Angular 22 (standalone, zoneless, signals), TypeScript strict, SCSS, Vitest, npm.
- **Organização por feature:** `core/` para singletons (interceptor, avisos, config), `features/<nome>/` com `pages/` (containers), `components/` (apresentação, só `input()`/`output()` e `OnPush`) e `data/` (data services tipados). `shared/` só quando houver UI reutilizável de verdade.
- **Estado:** signals locais no container; service por feature quando o estado for compartilhado. Store global só se a complexidade justificar.
- **API:** componentes nunca usam `HttpClient`. URL base relativa (`/api/v1`) injetada por token; em desenvolvimento, proxy para o backend. Nenhum segredo no bundle.
- **Erros:** um interceptor converte o Problem Details do backend em `ErroApi` com mensagem amigável, mapeada pelo `codigo`. O `detail` técnico nunca é exibido.
- **Acessibilidade:** regras de template do angular-eslint no lint e axe-core nos testes de componente.
- **Quality gate**, que reprova o build:

  | Verificação                       | Ferramenta                  | Critério                                                                  |
  | --------------------------------- | --------------------------- | ------------------------------------------------------------------------- |
  | Formatação                        | Prettier                    | Qualquer diferença                                                        |
  | Lint e acessibilidade de template | ESLint + angular-eslint     | Qualquer erro (inclui `OnPush` obrigatório, sem `any`, complexidade > 10) |
  | Testes                            | Vitest + TestBed + axe-core | Qualquer falha ou violação WCAG detectável                                |
  | Cobertura                         | Vitest (v8)                 | < 80% linha/statements/funções ou < 70% branch                            |
  | Tamanho do bundle                 | Budgets do Angular          | Inicial > 1 MB ou estilo de componente > 8 kB                             |
  | Dependências de produção          | `npm audit`                 | CVE alta ou crítica                                                       |
  | Segredos                          | Gitleaks                    | Qualquer segredo                                                          |
  | Dependências no PR                | Dependency Review           | CVE alta ou crítica                                                       |
  | Análise contínua (opcional)       | SonarQube Cloud             | Quality gate do Sonar                                                     |

## Consequências

- Todo projeto criado a partir deste modelo já começa com o gate ligado.
- A `main` precisa de proteção (PR obrigatório + checks verdes) para o gate valer de verdade. Em repositório público isso é gratuito.
- O axe-core no jsdom não mede contraste; ele é garantido pelos tokens de cor. Para uma checagem completa da página, rode o Lighthouse no navegador.
- Atualizações de versão principal do Angular são feitas com `ng update`, nunca pelo Dependabot.
