# Reusable Auth Architecture: Supabase Google OAuth + Single-User Whitelist + Offline Fallback

Use this document as a blueprint or paste it directly into a prompt to replicate this authentication structure in a React + Vite + TypeScript + Supabase application.

---

## 1. Architecture Overview

This authentication pattern supports three operating modes without requiring a custom backend server:
1. **Authenticated Cloud Mode**: Users sign in via Supabase Google OAuth (`signInWithOAuth`). Sessions persist in browser storage and refresh automatically.
2. **Single-User Email Whitelist (Optional)**: Enforces strict private-instance access in the UI by comparing the authenticated user's email against `VITE_ALLOWED_EMAIL`. If signed in with a non-whitelisted email, access is blocked on an "Access Restricted" screen with a sign-out button.
3. **Offline / Local Mode Fallback**:
   - Automatically activates if Supabase environment variables are missing or still set to placeholders.
   - Users can also manually enter offline mode from the login screen ("Continue Offline") and switch back later from the app header if Supabase is configured.

---

## 2. Dependencies & Environment Variables

### Package
```bash
npm install @supabase/supabase-js
```

### Environment Variables (`.env`)
```env
# Supabase Project Credentials
VITE_SUPABASE_URL=https://your-project-id.supabase.co
# Supports either VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY:
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key-here

# Optional: Single-User Strict Email Access Lock
# Leave unset to allow any authenticated Supabase user; set to restrict UI access to one email.
VITE_ALLOWED_EMAIL=your.email@gmail.com
```

---

## 3. File Structure

```text
src/
├── lib/
│   └── supabase.ts          # Client setup, env validation, ALLOWED_EMAIL, OAuth & sign-out helpers
├── context/
│   └── AuthContext.tsx      # Session state, auth listener, whitelist check, offline mode toggle
├── components/
│   ├── LoginPage.tsx        # Two-state login screen (Unauthorized vs Sign-In + Offline button)
│   └── Header/Dock.tsx      # User profile dropdown (Sign Out or "Connect to Cloud" from offline)
└── App.tsx                  # AppGate wrapper enforcing loading / login / main app states
supabase_schema.sql          # Tables with user_id FK to auth.users(id) + Row-Level Security policies
```

---

## 4. State Flow

```mermaid
flowchart TD
    Start[App Mount] --> CheckEnv{isSupabaseConfigured?}
    CheckEnv -- No --> Offline[isOfflineMode = true]
    CheckEnv -- Yes --> Loading[isLoading = true / getSession]
    Loading --> Gate{!isOfflineMode && (!user || !isAuthorized)}
    Offline --> MainApp[Render MainApp - Local Storage]
    Gate -- No --> MainApp
    Gate -- Yes --> CheckUser{user exists?}
    CheckUser -- "Yes (wrong email)" --> Restricted[LoginPage: Access Restricted + Sign Out]
    CheckUser -- No --> SignInUI[LoginPage: Google OAuth + Continue Offline]
    SignInUI -- "Click Continue Offline" --> Offline
    SignInUI -- "Click Google OAuth" --> OAuth[Redirect to Google -> Return to origin]
    OAuth --> AuthListener[onAuthStateChange updates user/session]
    AuthListener --> Gate
```

---

## 5. Implementation Specification

### A. Supabase Client & Helpers (`src/lib/supabase.ts`)
- Read `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY || VITE_SUPABASE_PUBLISHABLE_KEY`.
- Export `isSupabaseConfigured`: verify both values exist and do not contain placeholder substrings (`your-project`, `your-anon-key`, `your-publishable-key`).
- Export `ALLOWED_EMAIL`: normalize `VITE_ALLOWED_EMAIL` by stripping quotes (`replace(/['"]/g, '')`), lowercasing, and trimming.
- Export `supabase: SupabaseClient | null`: only call `createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })` when `isSupabaseConfigured` is `true`.
- Export `signInWithGoogle()`:
  ```ts
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  if (error) throw error;
  ```
- Export `signOutCloud()`: calls `await supabase.auth.signOut()` if `supabase` is initialized.

### B. Auth Context (`src/context/AuthContext.tsx`)
Expose `AuthContextType`:
- `user: User | null`
- `session: Session | null`
- `isLoading: boolean` (initializes to `isSupabaseConfigured`)
- `isConfigured: boolean`
- `isAuthorized: boolean`
- `isOfflineMode: boolean` (initializes to `!isSupabaseConfigured`)
- `setOfflineMode: (offline: boolean) => void`
- `signInWithGoogle: () => Promise<void>`
- `signOut: () => Promise<void>`

Lifecycle & Logic:
1. **`useEffect` on mount** (exits early if `!isSupabaseConfigured || !supabase`):
   - Call `supabase.auth.getSession()` to hydrate `session`, `user`, and set `isLoading(false)`.
   - Subscribe to `supabase.auth.onAuthStateChange((_event, session) => { ... })` to update `session`, `user`, and `isLoading(false)` on OAuth redirects, token refreshes, and sign-outs.
   - Return `() => subscription.unsubscribe()`.
2. **`isAuthorized` (`useMemo`)**:
   - If `isOfflineMode` is `true` → return `true`.
   - If `!user` → return `false`.
   - If `!ALLOWED_EMAIL` → return `true` (open to any authenticated user if no whitelist is set).
   - Otherwise normalize `(user.email || user.user_metadata?.email || '')` and compare strictly against normalized `ALLOWED_EMAIL`.
3. **`signOut`**:
   - Call `await signOutCloud()`, then clear `setUser(null)` and `setSession(null)`.

### C. App Gate (`src/App.tsx`)
Wrap the app in `<AuthProvider>` (and any data/theme providers), then render an `<AppGate />` component:
1. If `isLoading` → render a full-screen loading splash.
2. If `!isOfflineMode && (!user || !isAuthorized)` → render `<LoginPage />`.
3. Otherwise → render `<MainApp />`.

### D. Login Page (`src/components/LoginPage.tsx`)
Handle two UI states using `useAuth()`:
- **State A (`user && !isAuthorized`)**:
  - Show an "Access Restricted" card displaying `user.email || user.user_metadata?.email || 'Unknown'`.
  - Provide a **Sign Out & Switch Account** button calling `signOut`.
- **State B (Not signed in)**:
  - Render a **Continue with Google** button calling `signInWithGoogle()` with loading (`isSigningIn`) and error (`errorMessage`) states.
  - Render a **Continue Offline (Local Storage Mode)** button calling `setOfflineMode(true)`.

### E. Header / Profile Menu Integration
In the authenticated app header:
- **When `user` is present**: Show avatar (`user.user_metadata?.avatar_url`) or email initial, display `user.user_metadata?.full_name` and `user.email`, and provide a **Sign Out** button calling `signOut()`.
- **When in offline mode (`!user`)**: Indicate "Offline Mode" and, if `isConfigured` is `true`, provide a **Connect to Google / Cloud** button that calls `setOfflineMode(false)` (which immediately triggers `AppGate` to show `LoginPage`).

### F. Cloud Data Sync & Database Security (`supabase_schema.sql`)
1. **Client-side sync guard**: All cloud fetch, mutation sync, and Supabase Realtime subscriptions must gate on:
   ```ts
   if (!user || !isAuthorized || isOfflineMode) return;
   ```
   On first cloud login, check if the user has cloud data; if empty, optionally migrate existing `localStorage` data up to Supabase.
2. **Row-Level Security (RLS)** on every user-owned table:
   ```sql
   user_id uuid references auth.users(id) on delete cascade not null

   alter table public.<table_name> enable row level security;

   create policy "Users can manage own <table_name>"
     on public.<table_name>
     for all
     using (auth.uid() = user_id)
     with check (auth.uid() = user_id);
   ```

---

## 6. Important Security & Setup Notes
- **Supabase Dashboard Setup**: Enable the Google Auth provider in Supabase (*Authentication → Providers → Google*) with your Google OAuth Client ID & Secret, and add your local/production origins to *Authentication → URL Configuration → Redirect URLs*.
- **Client-Side Whitelist Scope**: `VITE_ALLOWED_EMAIL` is compiled into the frontend bundle and enforces single-user UI access. Database-level data isolation is enforced separately by Supabase RLS (`auth.uid() = user_id`). If you want strict backend rejection of non-owner sign-ups, disable public sign-ups or add a Supabase Auth hook/database check on top of this pattern.

