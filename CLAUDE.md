# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start in watch mode (alias for start:dev)
npm run build        # compile TypeScript via NestJS CLI
npm run lint         # ESLint with auto-fix
npm test             # run unit tests (Jest)
npm run test:e2e     # end-to-end tests
npm run test -- --testPathPattern=<file>  # run a single test file
```

Drizzle ORM:
```bash
npx drizzle-kit generate   # generate migration from schema changes
npx drizzle-kit migrate    # apply migrations to the database
npx drizzle-kit studio     # open Drizzle Studio (DB GUI)
```

## Architecture

**Stack**: NestJS + grammy (Telegram bot) + Drizzle ORM + PostgreSQL + OpenAI Whisper + ExcelJS.

**What it does**: Receives Telegram voice messages, transcribes them via OpenAI Whisper, saves to the DB, and replies with an Excel file attachment.

### Module structure (intended)

```
src/
  app.module.ts           # root module — imports DbModule, ConfigModule, BotModule
  db.module.ts            # NestJS module wrapping DbService (injectable Pool + Drizzle)
  db.service.ts           # DbService: exposes `db` (NodePgDatabase) to other services
  bot/
    bot.module.ts         # imports EmployeesModule, MessagesModule, ExcelModule
    bot.service.ts        # grammy bot lifecycle + all command/callback handlers
  modules/
    employees/            # CRUD for employee records
    messages/             # voice message records + OpenaiService (Whisper)
    excel/                # ExcelJS report generation
  common/
    guards/
      admin.guard.ts      # exports `isAdmin(userId, adminIds): boolean` (plain function)
drizzle/
  schema.ts               # Drizzle table definitions (employees + voice_messages)
  relations.ts            # Drizzle relations
```

### Path aliases

`tsconfig.json` must define these paths (they are used throughout the codebase but not yet configured):
```json
"paths": {
  "@modules/*": ["src/modules/*"],
  "@common/*": ["src/common/*"]
}
```
`nest-cli.json` must also set `"plugins": []` and `"webpack": false` if using `tsconfig-paths` (already in devDependencies).

### Database

- **`DbService`** (`src/db.service.ts`) is the canonical NestJS provider — it creates a `pg.Pool` and exposes `this.db` (Drizzle instance). Import `DbModule` and inject `DbService` in feature modules.
- There is also a legacy `src/db/db.ts` that exports a module-level singleton `db`; prefer `DbService` for NestJS injection.
- Schema lives in `drizzle/schema.ts` (currently empty — needs `employees` and `voice_messages` tables).
- `drizzle.config.ts` reads `DATABASE_URL` from env.

### Configuration

`@nestjs/config` (`ConfigService`) is used in `BotService` for:
- `telegram.botToken` — Telegram bot token
- `telegram.adminIds` — array of admin Telegram user IDs

`ConfigModule.forRoot()` must be imported in `AppModule` with a config factory that maps env vars to the `telegram` namespace.

### Bot logic (`bot.service.ts`)

- Initialises the grammy `Bot` in `onModuleInit` and calls `bot.start()` (long-polling).
- Uses an in-memory `Map<userId, { step, data }>` for multi-step admin conversation flows (add employee wizard).
- `isAdmin` is a plain function from `@common/guards/admin.guard`, not a NestJS guard class.
- Voice pipeline: download URL → OpenAI Whisper → save to DB → generate Excel → reply with file.
