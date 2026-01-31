import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const rawSupabaseUrl = (env.VITE_SUPABASE_URL ?? "").trim();
  const supabaseUrl = rawSupabaseUrl.replace(/\/+$/, "");


  return {
    server: {
      host: "localhost",
      port: 5374,
      strictPort: true,
      headers: {
        "Access-Control-Allow-Private-Network": "true",
      },
      proxy: supabaseUrl
        ? {
            "/supabase": {
              target: supabaseUrl,
              changeOrigin: true,
              secure: false,
              ws: true,
              rewrite: (p) => p.replace(/^\/supabase/, ""),
              configure: (proxy) => {
                proxy.on("proxyReq", (proxyReq, req) => {
                  const auth = (req as any)?.headers?.authorization;
                  const authLen = typeof auth === "string" ? auth.length : 0;
                  if (proxyReq && authLen > 0) {
                    proxyReq.setHeader("authorization", auth as string);
                  }

                  const apikey = (req as any)?.headers?.apikey;
                  const apikeyLen = typeof apikey === "string" ? apikey.length : 0;
                  if (proxyReq && apikeyLen > 0) {
                    proxyReq.setHeader("apikey", apikey as string);
                  }
                });

                proxy.on("proxyReqWs", (proxyReq, req) => {
                  const auth = (req as any)?.headers?.authorization;
                  const authLen = typeof auth === "string" ? auth.length : 0;
                  if (proxyReq && authLen > 0) {
                    proxyReq.setHeader("authorization", auth as string);
                  }

                  const apikey = (req as any)?.headers?.apikey;
                  const apikeyLen = typeof apikey === "string" ? apikey.length : 0;
                  if (proxyReq && apikeyLen > 0) {
                    proxyReq.setHeader("apikey", apikey as string);
                  }
                });
                proxy.on("error", (err) => {
                  console.error("[supabase][proxy_error]", err?.message ?? String(err));
                });
              },
            },
          }
        : undefined,
    },
    preview: {
      port: 5374,
      strictPort: true,
      host: "localhost",
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
