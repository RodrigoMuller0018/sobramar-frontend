## O quê

<!-- O que este PR muda, em uma ou duas frases. -->

## Por quê

<!-- Problema ou objetivo. Link da issue, se houver. -->

## Como testar

<!-- Passos para validar. Print da tela quando for visual. -->

## Checklist

- [ ] Resolve o que a descrição promete, sem mudança fora de escopo
- [ ] Testes cobrem o comportamento novo e os casos de borda (e falhariam sem a mudança)
- [ ] Componentes de apresentação sem serviço/HTTP; acesso à API só em data services
- [ ] Estado com signals; nenhum `subscribe` sem `takeUntilDestroyed` ou equivalente
- [ ] Erros mostrados ao usuário com mensagem útil (erro de campo no próprio campo)
- [ ] Sem segredo, chave ou URL de ambiente no código (tudo no front é público)
- [ ] Sem lógica no template além de exibição e condicionais simples

### Acessibilidade e LGPD (telas e formulários)

- [ ] Campos com `label`, erros associados (`aria-describedby`), foco visível
- [ ] Funciona só com teclado (Tab, Enter, Esc), sem armadilha de foco
- [ ] Imagens com `alt` (decorativas com `alt=""`) e contraste mínimo 4.5:1
- [ ] Formulário informa a finalidade dos dados e pede só o necessário
- [ ] Nenhum script de tracking ou cookie não essencial sem consentimento
