# Blog da Escola X — Aplicativo Mobile

Aplicativo mobile (iOS e Android) da plataforma de blog da rede estadual de ensino, desenvolvido como entrega do **Tech Challenge — FIAP Pós-graduação Full Stack**. Professores publicam e gerenciam conteúdo educacional; alunos o consultam pelo celular. O app consome a API REST do projeto [blogEscolaX](https://github.com/AnaDascenzio/blogEscolaX).

## Integrantes

- Ana Nicolly Bernardeli Fedirissi Dascenzio
- Gabriel Angelo da Silva
- Matheus Guilherme Barbosa do Nascimento
- Igor Lima Charles
- Wanderson Jafé Alexandre de Souza

## Tecnologias

| Tecnologia | Versão | Uso |
| --- | --- | --- |
| Expo (SDK 57) | ~57.0.30 | Plataforma de desenvolvimento e execução |
| React Native | 0.86.3 | Interface mobile |
| React | 19.2.3 | Componentes |
| Expo Router | ~57.0.28 | Navegação por arquivos e rotas protegidas |
| TypeScript | ~6.0.3 | Tipagem estática |
| expo-secure-store | ~57.0.4 | Armazenamento do token de sessão |
| ESLint | ^9 | Qualidade de código (`expo lint`) |

## Funcionalidades

**Aluno**
- Login.
- Lista de posts e leitura de cada publicação.

**Professor** (além do que o aluno faz)
- Painel administrativo de posts: criar, editar e excluir publicações.
- Módulo de alunos: listar (paginado e em ordem alfabética), cadastrar, editar e excluir.
- Módulo de professores: listar, cadastrar, editar e excluir.

### Regras de acesso

O arquivo `src/app/_layout.tsx` usa `Stack.Protected` para controlar as rotas:

| Situação | Rotas disponíveis |
| --- | --- |
| Sem sessão | Login (`/`) |
| Com sessão (aluno ou professor) | `/home`, `/post/[id]` |
| Com sessão e perfil professor | `/admin/posts/*`, `/admin/students/*` |

Quem tenta abrir uma rota sem permissão é redirecionado. Além disso, o back-end exige JWT de professor nas operações de escrita.

## Estrutura do projeto

```
src/
  app/        rotas (Expo Router): cada arquivo é uma tela
  screens/    componentes de tela reutilizados pelas rotas
  context/    estado global (auth-context: sessão e perfil)
  services/   acesso à API (auth, posts, students)
```

## Como executar

### Pré-requisitos

- Node.js e npm
- Docker Desktop (para o banco de dados)
- Aplicativo **Expo Go** no celular, ou um emulador Android/iOS
- Back-end do projeto: [blogEscolaX](https://github.com/AnaDascenzio/blogEscolaX)

### 1. Subir o back-end

No repositório do back-end:

```bash
docker compose up -d postgres
npm install
npm run start:dev
```

Para rodar a API fora do Docker, o `.env` do back-end deve usar `DATABASE_HOST=localhost`. Aguarde a mensagem `Database with typeorm connected`.

### 2. Criar o primeiro professor

O cadastro público não é permitido: o primeiro professor precisa ser inserido direto no banco. Depois disso, ele cadastra alunos e outros professores pelo app. No PowerShell, dentro da pasta do back-end:

```powershell
$hash = node -e "console.log(require('bcrypt').hashSync('Senha@123', 10))"
"INSERT INTO users (name, email, password, role, status) VALUES ('Professor Teste', 'professor@teste.com', '$hash', 'TEACHER', true);" | docker exec -i postgres psql -U superuser -d blog_db
```

Troque nome, e-mail e senha conforme necessário.

### 3. Configurar e rodar o app

```bash
npm install
```

Crie o arquivo `.env` na raiz do app com o endereço da API:

```
EXPO_PUBLIC_API_URL=http://IP_DO_SEU_PC:3000
```

Inicie o Expo e escaneie o QR code com o Expo Go:

```bash
npx expo start -c
```

> Variáveis `EXPO_PUBLIC_*` são lidas na geração do bundle. Sempre que alterar o `.env`, reinicie com `npx expo start -c`.

### Endereço da API por dispositivo

| Dispositivo | URL da API |
| --- | --- |
| Celular físico (mesmo Wi-Fi do PC) | `http://IP_DO_PC:3000` |
| Emulador Android | `http://10.0.2.2:3000` (o app converte `localhost` automaticamente) |
| Simulador iOS (Mac) | `http://localhost:3000` |

Para descobrir o IP do PC no Windows, use `ipconfig` e procure o IPv4 do adaptador Wi-Fi.

## Solução de problemas

- **"Não foi possível conectar à API":** confira se a API está rodando, se o celular está no mesmo Wi-Fi do PC e se o IP do `.env` é o atual.
- **Firewall do Windows:** libere as portas **3000** (API) e **8081** (Expo) e mantenha a rede Wi-Fi como privada.
- **Expo Go não abre o projeto:** use o modo túnel (`npx expo start --tunnel`). Ele exige o pacote `@expo/ngrok` (`npm install --no-save @expo/ngrok`). O túnel cobre apenas o Expo; a API continua acessada pela `EXPO_PUBLIC_API_URL`.
- **Lista vazia ou 401/403:** verifique se o login foi feito com um professor e se o back-end está atualizado.

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm start` | Inicia o Expo |
| `npm run android` / `npm run ios` | Abre no emulador/simulador |
| `npm run lint` | Executa o ESLint |
| `npx tsc --noEmit` | Verifica a tipagem |

## Limitações conhecidas

- O app é voltado a iOS e Android. Na web, o token fica apenas em memória (a sessão se perde ao recarregar a página) e `Alert.alert` com botões não funciona.
- A exclusão de usuários é lógica (soft delete): o usuário é inativado e deixa de aparecer, mas o registro permanece no banco, e o e-mail dele não pode ser reutilizado.
- No cadastro de alunos, o app envia a senha padrão `123456`, que o back-end criptografa.

## Repositórios

- Mobile: <https://github.com/AnaDascenzio/blog-escola-x-mobile>
- Back-end: <https://github.com/AnaDascenzio/blogEscolaX>

## Contexto acadêmico

Projeto desenvolvido para o Tech Challenge da pós-graduação em Full Stack Development da FIAP.
