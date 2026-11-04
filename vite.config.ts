import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Automatically resolve Supabase variables whether set via Vercel integration (SUPABASE_URL, NEXT_PUBLIC_...) or VITE_ prefix
  const supabaseUrl =
    env.VITE_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    env.SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    '';

  const supabaseKey =
    env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    '';

  const allowedEmail = (
    env.VITE_ALLOWED_EMAIL ||
    process.env.VITE_ALLOWED_EMAIL ||
    ''
  ).replace(/['"]/g, '').trim().toLowerCase();

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      ...(supabaseUrl ? { 'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl.replace(/['"]/g, '').trim()) } : {}),
      ...(supabaseKey ? { 'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseKey.replace(/['"]/g, '').trim()) } : {}),
      ...(supabaseKey ? { 'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(supabaseKey.replace(/['"]/g, '').trim()) } : {}),
      ...(allowedEmail ? { 'import.meta.env.VITE_ALLOWED_EMAIL': JSON.stringify(allowedEmail) } : {}),
    },
  };
});

