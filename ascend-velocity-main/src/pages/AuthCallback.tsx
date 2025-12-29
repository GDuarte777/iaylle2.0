import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { initialize } = useAuthStore();

  useEffect(() => {
    const run = async () => {
      try {
        await supabase.auth.getSession();
        await initialize();
      } finally {
        navigate("/dashboard", { replace: true });
      }
    };
    run();
  }, [initialize, navigate]);

  return <div className="min-h-screen" />;
}
