## Project Structure

* `app/` → Next.js App Router
* `components/` → `auth/`, `layout/`, `navigation/`, `ui/`
* `lib/` → utils & configs
* Root → config files only
* **Naming:** kebab-case (dirs/files), PascalCase (components), Next.js conventions (`page.tsx`, `layout.tsx`)

## Authentication

* Env vars → `.env.local` (`NEXT_PUBLIC_` for client)
* Supabase client → `lib/supabase.ts`
* Auth context → `components/auth/auth-provider.tsx`
* Protected routes → `components/auth/protected-route.tsx`
* Handle success/error/loading + redirect after login/logout
* Use TS interfaces for user data

## Forms

* Validation → Zod + react-hook-form
* Use `Controller` for custom inputs
* Show errors under fields
* Disable submit on loading

## UI

* Base → Shadcn/ui + Tailwind CSS
* Icons → Lucide React
* Layouts → `MainLayout`, `PageWrapper`
* Centralized navbar
* Use `Card` for grouping
* Accessible, validated forms

## Development

* Strict TypeScript, define interfaces, type props
* Import order: React → Next.js → third-party → local (`@/`)
* Consistent, user-friendly error handling + logging
* Prettier/Tailwind formatting enabled on save or pre-commit
* ESLint/TSLint for code quality

## Performance

* Use App Router + proper loading states
* Optimize images/assets
* Small, single-purpose components
* Extract hooks + lazy load where needed

## Security
* Never hard code credentials
* Never commit secrets
* Env vars in `.env.local`, validated at startup
* Supabase session management + permission checks
* HTTPS in production
