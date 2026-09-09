# AI Coding Agent Instructions for Log Complexity

## Project Overview

**Log Complexity** is a full-stack TypeScript application that analyzes code complexity using LLMs and compilers. It features a React/Vite frontend and Fastify backend with support for multiple language compilers (TypeScript/JavaScript, C++, Java, Rust).

**Key Tech Stack:**

- **Frontend:** React 19, Vite, TailwindCSS, Recharts, React Router, Radix UI
- **Backend:** Fastify 5, TypeScript (ES2022), ts-morph, node-llama-cpp, Mongoose
- **Build:** pnpm (monorepo-like structure), ts-node-dev for dev

---

## Critical Architecture Patterns

### 1. **Module Organization with DI Container**

The backend uses a **Dependency Injection pattern** via `src/core/di/container.ts`:

- **Entry point:** `AppBootstrap.ts` calls `createApp()` which initializes Fastify
- **Module registration:** Routes registered at `src/module/routes/fileRoute.ts`
- **Pattern:** Each route module exports a Fastify plugin, registered in container with prefix

**Example route structure:**

```typescript
// Routes are async Fastify plugins
export default async function (fastify: FastifyInstance) {
  fastify.post("/repos/analyze", async (request, reply) => {
    /*...*/
  });
}
```

### 2. **Explicit File Extensions in Imports (Node16 Module Resolution)**

- **tsconfig.json** uses `"moduleResolution": "NodeNext"`
- **ALL ES module imports must include `.js` extension** even in TypeScript files
- ❌ Wrong: `import { bootstrap } from "./AppBootstrap"`
- ✅ Correct: `import { bootstrap } from "./AppBootstrap.js"`
- This applies to relative imports only (node_modules don't need extensions)

### 3. **Frontend Routing with React Router**

- Routes in [src/App.tsx](src/App.tsx): `/`, `/login`, `/dashboard`, `/dashboard/analysis/full-report`
- Each page is in `src/pages/` and wraps dashboard components
- **Context Providers:** `NotificationProvider`, `TooltipProvider` wrap entire app

### 4. **Backend API Communication**

- **Base setup:** [src/utils/axios.ts](client/src/utils/axios.ts) creates axios instance with `VITE_LOCAL_BACKEND_URL`
- **CORS enabled** for `http://localhost:5173` (Vite default)
- **Multipart uploads** registered via `@fastify/multipart` for file analysis
- **Main endpoint:** `POST /api/file/repos/analyze` (accepts FormData)

### 5. **Compiler Integration Pattern**

- Compilers live in `server/src/compliers/{LANGUAGE}_Compiler/`
- Registered as Fastify plugins in container (see `compiler_plugin`)
- Each compiler can parse/analyze code AST via ts-morph (TypeScript) or language-specific parsers

---

## Developer Workflows

### Frontend Development

```bash
cd client
pnpm install
pnpm run dev          # Vite dev server on http://localhost:5173
pnpm run build        # TypeScript + Vite build
pnpm run lint         # ESLint validation
```

### Backend Development

```bash
cd server
pnpm install
pnpm run dev          # ts-node-dev watches src/app/server.ts (auto-respawn)
pnpm run build        # Compile TypeScript to dist/
pnpm run prisma:dev   # Database migrations (if configured)
```

### Docker (Optional)

```bash
docker-build          # Builds server image from server/Dockerfile
docker-run: release   # Runs compiled version
docker-run: debug     # Runs with DEBUG=* and NODE_ENV=development
```

---

## Project-Specific Conventions

### Import Patterns

- **Relative imports** in backend always use `.js`: `import { x } from "./module.js"`
- **Type imports** work normally: `import type { Interface } from "./types.js"`
- **API clients** exported from [client/src/utils/axios.ts](client/src/utils/axios.ts) (e.g., `uploadAndAnalyzeFiles()`)

### Component Organization (Frontend)

- **UI components:** [src/components/ui/](client/src/components/ui/) - Radix/shadcn-based primitives
- **Page components:** [src/pages/](client/src/pages/) - Full page layouts
- **Dashboard components:** [src/components/dashboard/](client/src/components/dashboard/) - CodeEditor, ComplexityChart
- **Context/Hooks:** [src/context/](client/src/context/), [src/hooks/](client/src/hooks/) - State management

### Backend Route/Handler Pattern

- Routes are async Fastify plugin functions
- Request/reply types come from Fastify (check `@types/fastify`)
- Handlers in usecases or adapters (see `src/module/usecases/`, `src/module/adapters/`)

### Type Safety

- **Backend:** `"strict": true` in tsconfig - always add types
- **Frontend:** React 19 components default to typed props, use interfaces from `src/types/`

---

## Cross-Component Integration

### Frontend → Backend Data Flow

1. **Client calls API:** `uploadAndAnalyzeFiles(formData)` → `POST /api/file/repos/analyze`
2. **Backend processes:** File parsed by appropriate compiler (TS/C++/Java/Rust)
3. **LLM analysis:** ts-morph or compiler output sent to `node-llama-cpp` for complexity analysis
4. **Response:** JSON returned to client, stored/displayed via `ComplexityChart`, `ComplexityResultPage`

### Database (If Used)

- Mongoose models likely in `src/module/model/`
- Currently commented out in container; uncomment when needed
- Connection in `src/infra/db/mongo.ts`

---

## Common Tasks & Patterns

### Adding a New API Endpoint

1. Create handler in `src/module/usecases/` or `src/module/adapters/`
2. Add route to `src/module/routes/fileRoute.ts` as Fastify route
3. Import route in `src/module/index.ts`
4. Add client function in `client/src/utils/axios.ts`

### Adding a New Compiler

1. Create folder in `server/src/compliers/{LANGUAGE}_Compiler/`
2. Implement analyzer (use ts-morph for AST parsing or language SDK)
3. Export as Fastify plugin in `plugins/compiler_plugin.ts`
4. Register in container via plugin registration

### Debugging Frontend

- Use Vite HMR (hot reload works automatically)
- Check browser DevTools for API requests to `http://localhost:3000/api/*`
- Notification context logs to console/UI via `useNotification()`

### Debugging Backend

- Run `pnpm run dev` (ts-node-dev respawns on file changes)
- Check Fastify logger output (enabled by default in `createApp()`)
- Use `console.log()` or VS Code debugger (configure launch.json if needed)

---

## Known Constraints & Edge Cases

- **File size limit:** 200KB per file (set in `fastifyMultipart` limits)
- **Max files per upload:** 300 files
- **CORS:** Only `http://localhost:5173` allowed (hardcoded for dev)
- **Module resolution:** Must use `.js` extensions or TypeScript will not compile
- **Environment:** `VITE_LOCAL_BACKEND_URL` must be set in `.env` for frontend

---

## Key Files Reference

| File                                                                           | Purpose                                               |
| ------------------------------------------------------------------------------ | ----------------------------------------------------- |
| [server/src/app/AppBootstrap.ts](server/src/app/AppBootstrap.ts)               | DI container initialization                           |
| [server/src/core/di/container.ts](server/src/core/di/container.ts)             | Fastify app setup, route registration, error handling |
| [server/src/module/index.ts](server/src/module/index.ts)                       | Module exports (currently fileRoute only)             |
| [server/src/module/routes/fileRoute.ts](server/src/module/routes/fileRoute.ts) | File upload & analysis routes                         |
| [client/src/App.tsx](client/src/App.tsx)                                       | React Router setup, provider wrapping                 |
| [client/src/utils/axios.ts](client/src/utils/axios.ts)                         | API client functions (auth, file, user)               |
| [client/src/pages/DashboardPage.tsx](client/src/pages/DashboardPage.tsx)       | Main dashboard UI                                     |
| [compose_db.yaml](compose_db.yaml)                                             | Docker Compose for databases (Mongo, Postgres)        |
