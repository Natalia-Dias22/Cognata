# Cognata

Interface web para reconstrução computacional de formas linguísticas ancestrais a partir de cognatos em línguas modernas. Projeto de TCC / Engenharia de Produto e Software — Fase 1: reconstrução do Latim a partir de línguas românicas (Português, Italiano, Espanhol, Francês, Romeno).

> ⚠️ **Status atual:** este frontend está com dados **mockados**. A palavra reconstruída exibida na tela ainda não vem de um modelo real — a integração com o backend (que roda o modelo Cognate Transformer) está em andamento.

## Stack

- [Next.js](https://nextjs.org)
- [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com)

## Pré-requisitos

- [Node.js](https://nodejs.org) instalado (versão LTS recomendada)

Verifique se já tem instalado:

```bash
node -v
npm -v
```

## Como rodar localmente

1. Clone ou baixe este repositório e entre na pasta do projeto:

   ```bash
   cd cognata
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Rode o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

4. Abra [http://localhost:3000](http://localhost:3000) no navegador.

## Como funciona (interface)

A entrada de dados é feita em formato de chat: o sistema pergunta a palavra em cada uma das 5 línguas românicas (Português, Italiano, Espanhol, Francês, Romeno), uma de cada vez. Depois de coletadas as 5 respostas, o sistema exibe a forma reconstruída correspondente.

## Testes

O projeto usa **Jest** + **React Testing Library**. Os testes ficam na pasta `tests/` (fora de `app/`) e cobrem o fluxo completo da interface de chat, mockando a função `reconstructWord` (`lib/reconstruct.ts`) — nenhum teste depende de rede ou do backend real.

### Como rodar

```bash
npm run test
```

Modo watch (re-executa automaticamente a cada alteração no código):

```bash
npm test -- --watch
```

### O que é testado

Arquivo: `tests/page.test.tsx`

| Teste | O que valida |
|-------|--------------|
| Percorre as cinco línguas na ordem correta | O chat inicia em Português e avança pela sequência Português → Italiano → Espanhol → Francês → Romeno, exibindo a pergunta certa em cada etapa; ao final das 5 respostas, exibe o estado "Modelo em execução" |
| Bloqueia respostas vazias ou só com espaços | O botão de envio permanece desabilitado se o campo estiver vazio ou preenchido apenas com espaços em branco; a pergunta atual não avança |
| Exibe a palavra retornada pela reconstrução | Após as 5 respostas, o resultado retornado pelo mock (`reconstructWord`) é exibido corretamente na tela, junto com a mensagem de conclusão |
| Exibe mensagem clara quando a reconstrução falha | Se a chamada de reconstrução falhar (Promise rejeitada), a interface exibe uma mensagem de erro acessível (`role="alert"`) e o campo de input volta a ficar habilitado, permitindo nova tentativa |

### Resultado esperado

```
PASS  tests/page.test.tsx
  Fluxo do Reconstrutor Latino
    ✓ inicia em Português e percorre as cinco línguas na ordem correta
    ✓ bloqueia o envio de respostas vazias ou compostas apenas por espaços
    ✓ exibe a palavra retornada pela reconstrução
    ✓ exibe uma mensagem clara quando a reconstrução falha

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

## Integração com o backend (pendente)

O resultado exibido hoje é um valor fixo de exemplo. A integração real vai substituir esse mock por uma chamada à API do backend:

```
POST /reconstruir
Body: { pt, it, es, fr, ro }
Resposta esperada: { palavra_reconstruida }
```

O ponto exato no código onde essa chamada deve entrar está sinalizado com comentários (buscar por `TODO` ou pela lógica do estado de "processando" no componente de chat).

## Roadmap

- [x] Testes automatizados do fluxo de chat (Jest + React Testing Library)
- [ ] Integrar com endpoint real `/reconstruir`
- [ ] Tratamento de erros na chamada da API
- [ ] Configurar URL da API via variável de ambiente (dev/produção)
- [ ] Pipeline CI/CD (build → lint → test)
- [ ] Deploy (Vercel/Netlify)
- [ ] Fase 2: expandir para reconstrução de Proto-Indo-Europeu (PIE)