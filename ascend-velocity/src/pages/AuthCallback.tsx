import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { initialize } = useAuthStore();

  const redirectRaw = searchParams.get("redirect");
  const redirect = redirectRaw && redirectRaw.startsWith("/") ? redirectRaw : null;

  useEffect(() => {
    const run = async () => {
      try {
        const code = searchParams.get("code");
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        } else {
          await supabase.auth.getSession();
        }
        await initialize();
      } finally {
        navigate(redirect ?? "/dashboard", { replace: true });
      }
    };
    run();
  }, [initialize, navigate, redirect, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-neon-blue" />
    </div>
  );
}
