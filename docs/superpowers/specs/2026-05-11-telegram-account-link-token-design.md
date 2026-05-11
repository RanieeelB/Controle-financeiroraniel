# Telegram Account Link Token Design

## Goal

Permitir que cada conta do app gere um token único de vinculação com o Telegram, usado uma única vez para conectar o `telegram_user_id` correto sem depender de configuração manual por ambiente para cada usuário.

## Approved Direction

Usar um token aleatório forte, gerado uma única vez por conta no backend, mostrado apenas uma vez na tela de configurações e salvo no banco apenas como hash. Quando o usuário informar esse token ao bot no Telegram, o backend valida o hash, vincula o `telegram_user_id` à conta correta e invalida o token para novos usos.

## Product Behavior

- Cada conta pode gerar no máximo um token de acesso para Telegram.
- O token, depois de gerado, não pode ser editado, regenerado ou exibido novamente.
- O token permanece válido indefinidamente até ser usado com sucesso.
- Depois do vínculo, o bot deixa de pedir token para aquele `telegram_user_id`.
- O vínculo é persistente por conta e por `telegram_user_id`.
- Se o usuário ainda não estiver vinculado, o bot entra em fluxo de onboarding e pede o token.
- Se já estiver vinculado, `/start` responde normalmente com a ajuda e os exemplos do bot.

## Data Model

Criar uma estrutura dedicada para o vínculo Telegram, em vez de sobrecarregar `profiles`.

Campos sugeridos em `telegram_connections`:

- `user_id`
- `link_token_hash`
- `token_generated_at`
- `telegram_user_id`
- `telegram_chat_id`
- `linked_at`

Restrições:

- `user_id` único para garantir um vínculo por conta.
- `telegram_user_id` único para impedir que o mesmo Telegram seja conectado a múltiplas contas.

## Settings UX

- Adicionar uma seção "Telegram" em `Settings`.
- Se não houver token nem vínculo, mostrar botão `Gerar token de acesso`.
- Ao gerar, o frontend chama uma rota autenticada do backend.
- O backend cria o token, salva apenas o hash e retorna o valor bruto apenas nessa resposta.
- A UI mostra o token uma única vez com instrução clara de copiar naquele momento.
- Depois disso:
  - se ainda não houve vínculo, exibir estado `Token gerado aguardando vinculação`;
  - se o vínculo já existir, exibir estado `Telegram conectado`.

## Telegram Flow

- `/start`
  - se o `telegram_user_id` já estiver vinculado, responder com a mensagem padrão do bot;
  - se não estiver vinculado, pedir o token de acesso.
- Próxima mensagem:
  - se o usuário ainda não estiver vinculado, tratar a mensagem como tentativa de vínculo;
  - se o token for válido, salvar `telegram_user_id`, `telegram_chat_id`, `linked_at`, limpar `link_token_hash` e confirmar a conexão;
  - se o token for inválido, responder com erro genérico sem revelar detalhes.
- Após o vínculo, todas as mensagens financeiras passam a usar a conta associada ao `telegram_user_id`.

## Security Rules

- Gerar token com entropia alta no backend.
- Salvar somente o hash do token no banco.
- Nunca logar o token bruto.
- Nunca expor o token no frontend depois da geração inicial.
- Nunca permitir reutilização após vínculo concluído.
- Não revelar se uma conta existe, se o token já foi usado ou se pertence a outro usuário.
- Rejeitar tentativa de vincular um `telegram_user_id` já associado a outra conta.

## API and Backend Shape

- Criar uma rota autenticada para gerar o token do usuário logado.
- Adaptar o webhook do Telegram para operar em dois modos:
  - modo de vínculo, quando o `telegram_user_id` ainda não tem conexão;
  - modo operacional, quando já existe conexão e o bot pode registrar gastos, entradas e consultar resumo.
- Remover `TELEGRAM_ALLOWED_USER_ID` da regra principal de negócio nessa segunda fase e substituí-lo pelo vínculo persistente no banco.

## Error Handling

- Token inválido: mensagem genérica.
- Conta já vinculada: informar que o Telegram já está conectado.
- Telegram já vinculado a outra conta: bloquear com mensagem genérica.
- Mensagem financeira antes do vínculo: pedir token.
- Nunca retornar stack trace ao Telegram.

## Testing

- Testes unitários para geração e hash do token.
- Testes unitários para o fluxo `/start` com e sem vínculo.
- Teste de uso único do token.
- Teste de unicidade de `telegram_user_id`.
- Teste da UI de configurações para geração única e não reexibição.
- Testes de regressão do parser e do fluxo financeiro após o vínculo.
