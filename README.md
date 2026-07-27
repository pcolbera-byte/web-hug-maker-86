# Moedim — Calendário Bíblico Hebraico

Aplicação web interativa para consulta do calendário hebraico bíblico, com informações sobre os meses, festas, shabat e datas comemorativas de Israel.

## Sumário

- [Sobre o projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Como executar localmente](#como-executar-localmente)
- [Scripts disponíveis](#scripts-disponíveis)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Deploy](#deploy)
- [Licença](#licença)

## Sobre o projeto

O **Moedim** é uma ferramenta de consulta e aprendizado sobre o calendário bíblico hebraico. O nome "Moedim" (מועדים) vem do hebraico e significa "tempos determinados" ou "festas fixas", conforme descrito nas Escrituras.

O projeto apresenta:

- Calendário mensal hebraico com data atual do dia gregoriano
- Conversão entre datas hebraicas e gregorianas
- Listagem completa das festas bíblicas (Páscoa, Pentecostes, Trombetas, Expiação, Cabanas, etc.)
- Datas comemorativas como **9 de Av** (Tisha B'Av) e **15 de Av** (Tu B'Av)
- Shabat e cálculo de horários
- Interface responsiva com modo claro e escuro
- Identidade visual moderna com tipografia Space Grotesk + Inter

## Funcionalidades

- **Calendário**: visualização mensal dos meses hebraicos, com destaque para o dia atual e festas do mês.
- **Festas**: detalhes sobre cada festa, significado bíblico, data aproximada e referências.
- **Shabat**: informações sobre o dia de descanso e horários de início e fim.
- **Conversor**: conversão entre datas gregorianas e hebraicas.
- **Configurações**: ajuste de preferências como tema claro/escuro, idioma e localização.

## Tecnologias

- [React 19](https://react.dev/)
- [TanStack Start](https://tanstack.com/start/latest) — framework full-stack com roteamento em arquivo
- [TanStack Router](https://tanstack.com/router/latest)
- [TanStack Query](https://tanstack.com/query/latest)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/) — componentes acessíveis
- [Vite](https://vitejs.dev/) — build e dev server
- [Bun](https://bun.sh/) — runtime e gerenciador de pacotes (recomendado)

## Como executar localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18+ ou [Bun](https://bun.sh/) 1.0+
- Git

### Passos

1. Clone o repositório:

   ```bash
   git clone https://github.com/pcolbera-byte/moedim.git
   cd moedim
   ```

2. Instale as dependências:

   ```bash
   bun install
   ```

   Ou, com npm:

   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:

   ```bash
   bun dev
   ```

   Ou, com npm:

   ```bash
   npm run dev
   ```

4. Abra o navegador em `http://localhost:8080`.

## Scripts disponíveis

| Script | Descrição |
| --- | --- |
| `dev` | Inicia o servidor de desenvolvimento em `http://localhost:8080` |
| `build` | Gera a build de produção |
| `build:dev` | Gera a build em modo de desenvolvimento |
| `preview` | Visualiza a build de produção localmente |
| `lint` | Executa o ESLint em todo o projeto |
| `format` | Formata o código com Prettier |

## Estrutura do projeto

```text
moedim/
├── src/
│   ├── components/          # Componentes React da aplicação
│   │   └── MoedimApp.jsx    # Aplicação principal do calendário
│   ├── hooks/               # Hooks customizados
│   ├── lib/                 # Utilitários e helpers
│   ├── routes/              # Rotas do TanStack Router
│   │   ├── __root.tsx       # Layout raiz
│   │   └── index.tsx        # Página inicial
│   ├── styles.css           # Estilos globais e tema Tailwind
│   └── vite-env.d.ts        # Tipos do Vite
├── public/                  # Assets públicos
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## Deploy

### Publicação no Lovable (recomendado)

1. No editor do Lovable, clique no botão **Publish** (canto superior direito).
2. O Lovable gera uma URL pública, por exemplo: `https://web-hug-maker-86.lovable.app`.
3. Para conectar um domínio personalizado:
   - Vá em **Project Settings → Project section → Domains**.
   - Clique em **Connect Domain** e digite seu domínio.
   - Adicione os registros DNS indicados no painel da sua registradora.

### Deploy em outras plataformas

Este projeto é um app **TanStack Start** com SSR e requer um ambiente Node.js. Plataformas compatíveis:

- [Vercel](https://vercel.com/)
- [Netlify](https://www.netlify.com/)
- [Railway](https://railway.app/)
- [Render](https://render.com/)
- VPS/cloud com Node.js e um processo como `pm2` ou `systemd`

Hospedagens compartilhadas sem suporte a Node.js não são recomendadas, pois a aplicação depende de execução server-side.

### Build de produção

```bash
bun run build
```

A build será gerada no diretório configurado pelo Vite/Nitro, pronta para deploy.

## Licença

Este projeto está sob a licença MIT. Sinta-se livre para usar, modificar e distribuir.

---

Feito com propósito para ensinar e preservar as datas e festas bíblicas hebraicas.
