import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Cargar variables de entorno
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
  server: {
    host: "::",
    port: 5173,
    proxy: {
      // Proxy para el backend Spring Boot
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
      // Proxy para la API de RENIEC - evita problemas de CORS
      "/api/reniec": {
        target: "https://api.factiliza.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/reniec/, ""),
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            // Extraer el DNI del query parameter
            const url = new URL(req.url || "", "http://localhost");
            const dni = url.searchParams.get("numero");
            
            if (dni) {
              // Modificar la ruta para usar el formato de la nueva API
              proxyReq.path = `/v1/dni/info/${dni}`;
              // Limpiar los query parameters ya que el DNI va en la ruta
              proxyReq.path = proxyReq.path.split("?")[0];
            }
            
            // Agregar headers de autenticación si está disponible
            // Cargar la clave de API desde las variables de entorno
            const apiKey = env.VITE_FACTILIZA_API_KEY || env.FACTILIZA_API_KEY;
            
            if (apiKey) {
              // Intentar con Authorization Bearer primero
              proxyReq.setHeader("Authorization", `Bearer ${apiKey}`);
              // También intentar con X-API-Key como alternativa
              proxyReq.setHeader("X-API-Key", apiKey);
              // Algunas APIs usan solo el header X-API-Key sin Bearer
              proxyReq.setHeader("apikey", apiKey);
            }
            
            proxyReq.setHeader("Accept", "application/json");
            proxyReq.setHeader("Content-Type", "application/json");
          });
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
});
