# Alterações necessárias na API

Este documento registra o contrato esperado para concluir o CRUD de professores
e alunos no app. A API Node.js continua sendo a fonte oficial dos cadastros; o
app usa o login JWT existente. Não duplicar os usuários no Firestore.

## O que já existe

| Operação | Endpoint existente | Situação |
| --- | --- | --- |
| Login | `POST /users/signin` | Retorna `{ "token": "..." }` |
| Criar usuário | `POST /users` | Usa o papel `TEACHER` ou `STUDENT` |
| Buscar por ID | `GET /users/:id` | Busca um cadastro individual |
| Buscar por e-mail/nome | `GET /users/email/:email`, `GET /users/name/:name` | Buscas individuais |
| Atualizar usuário | `PUT /users/:id` | Atualiza um cadastro |

## Endpoints a adicionar ou completar

### Listar professores e alunos

Adicionar `GET /users` com filtro por papel e paginação:

```http
GET /users?role=TEACHER&page=1&limit=20
Authorization: Bearer <jwt>
```

Valores aceitos para `role`: `TEACHER` e `STUDENT`. A listagem deve retornar
somente cadastros ativos e nunca incluir senha ou hash de senha. Sugestão de
resposta:

```json
{
  "items": [
    {
      "id": 1,
      "name": "Ana",
      "email": "ana@example.com",
      "role": "TEACHER",
      "status": true
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1,
  "totalPages": 1
}
```

Definir limites para `page` e `limit`, validar os parâmetros e documentar o
comportamento quando `role` não for informado.

### Exclusão lógica

Adicionar `DELETE /users/:id`. A operação deve definir `status` como `false`
em vez de remover permanentemente o registro:

```http
DELETE /users/1
Authorization: Bearer <jwt>
```

Sugestão de resposta: `204 No Content`. O cadastro inativo deve deixar de
aparecer em listagens e buscas usadas para administração, e não pode autenticar
em `POST /users/signin`. A exclusão repetida deve ter comportamento definido
(por exemplo, `404` para usuário inexistente ou já inativo).

## Autorização e consistência

- Validar o JWT no backend em todos os endpoints protegidos; esconder botões ou
  rotas no app não substitui autorização no servidor.
- Restringir listagem, criação, edição e inativação de usuários a um professor
  autenticado, conforme a regra de acesso definida pelo projeto.
- Não confiar no `role` enviado pelo app para conceder privilégios. Definir como
  uma conta de professor é provisionada e se o cadastro de alunos é público ou
  restrito.
- Confirmar que `GET /users/:id`, as buscas por e-mail/nome e o login respeitam
  `status: true`.
- Manter o hash de senha fora de todas as respostas. Exigir autenticação e
  autorização também no endpoint de atualização existente.
- Padronizar erros: `400` para parâmetros inválidos, `401` para token ausente,
  inválido ou expirado, `403` para papel sem permissão e `404` para cadastro
  inexistente ou inativo.

## Critérios de validação

1. Um professor autenticado consegue listar somente usuários ativos, filtrando
   por `TEACHER` ou `STUDENT`, com paginação.
2. Um professor autenticado consegue inativar um cadastro, que não aparece mais
   nas listagens e não consegue fazer login.
3. Um aluno ou visitante não consegue listar, criar, atualizar ou inativar
   cadastros.
4. Nenhuma resposta de usuário expõe senha ou hash de senha.
5. Testes cobrem paginação, filtros, papel sem permissão, token inválido,
   usuário inexistente/inativo e tentativa de login de usuário inativo.
