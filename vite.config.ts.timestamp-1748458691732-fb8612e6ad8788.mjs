var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};

// scripts/fetch-sitemap.js
var fetch_sitemap_exports = {};
import fs from "fs/promises";
import fetch from "file:///home/project/node_modules/node-fetch/src/index.js";
async function fetchAndSaveSitemap() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/generate-sitemap`,
      {
        headers: {
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
    }
    const sitemap = await response.text();
    await fs.writeFile("public/sitemap.xml", sitemap);
    console.log("Sitemap updated successfully");
  } catch (error) {
    console.error("Error updating sitemap:", error);
    process.exit(1);
  }
}
var SUPABASE_URL, SUPABASE_ANON_KEY;
var init_fetch_sitemap = __esm({
  "scripts/fetch-sitemap.js"() {
    SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
    fetchAndSaveSitemap();
  }
});

// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
var sitemapPlugin = () => ({
  name: "sitemap-plugin",
  async closeBundle() {
    try {
      const { fetchAndSaveSitemap: fetchAndSaveSitemap2 } = await Promise.resolve().then(() => (init_fetch_sitemap(), fetch_sitemap_exports));
      await fetchAndSaveSitemap2();
    } catch (error) {
      console.error("Error generating sitemap:", error);
    }
  }
});
var vite_config_default = defineConfig({
  plugins: [react(), sitemapPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"]
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2NyaXB0cy9mZXRjaC1zaXRlbWFwLmpzIiwgInZpdGUuY29uZmlnLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zY3JpcHRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NjcmlwdHMvZmV0Y2gtc2l0ZW1hcC5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9wcm9qZWN0L3NjcmlwdHMvZmV0Y2gtc2l0ZW1hcC5qc1wiO2ltcG9ydCBmcyBmcm9tICdmcy9wcm9taXNlcyc7XG5pbXBvcnQgZmV0Y2ggZnJvbSAnbm9kZS1mZXRjaCc7XG5cbmNvbnN0IFNVUEFCQVNFX1VSTCA9IHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMO1xuY29uc3QgU1VQQUJBU0VfQU5PTl9LRVkgPSBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZO1xuXG5hc3luYyBmdW5jdGlvbiBmZXRjaEFuZFNhdmVTaXRlbWFwKCkge1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goXG4gICAgICBgJHtTVVBBQkFTRV9VUkx9L2Z1bmN0aW9ucy92MS9nZW5lcmF0ZS1zaXRlbWFwYCxcbiAgICAgIHtcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICdBdXRob3JpemF0aW9uJzogYEJlYXJlciAke1NVUEFCQVNFX0FOT05fS0VZfWAsXG4gICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcblxuICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIGZldGNoIHNpdGVtYXA6ICR7cmVzcG9uc2Uuc3RhdHVzVGV4dH1gKTtcbiAgICB9XG5cbiAgICBjb25zdCBzaXRlbWFwID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xuICAgIGF3YWl0IGZzLndyaXRlRmlsZSgncHVibGljL3NpdGVtYXAueG1sJywgc2l0ZW1hcCk7XG4gICAgY29uc29sZS5sb2coJ1NpdGVtYXAgdXBkYXRlZCBzdWNjZXNzZnVsbHknKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciB1cGRhdGluZyBzaXRlbWFwOicsIGVycm9yKTtcbiAgICBwcm9jZXNzLmV4aXQoMSk7XG4gIH1cbn1cblxuZmV0Y2hBbmRTYXZlU2l0ZW1hcCgpOyIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvcHJvamVjdFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvcHJvamVjdC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzL3Byb21pc2VzJztcblxuLy8gUGx1Z2luIHRvIHVwZGF0ZSBzaXRlbWFwIGR1cmluZyBidWlsZFxuY29uc3Qgc2l0ZW1hcFBsdWdpbiA9ICgpID0+ICh7XG4gIG5hbWU6ICdzaXRlbWFwLXBsdWdpbicsXG4gIGFzeW5jIGNsb3NlQnVuZGxlKCkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB7IGZldGNoQW5kU2F2ZVNpdGVtYXAgfSA9IGF3YWl0IGltcG9ydCgnLi9zY3JpcHRzL2ZldGNoLXNpdGVtYXAuanMnKTtcbiAgICAgIGF3YWl0IGZldGNoQW5kU2F2ZVNpdGVtYXAoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZ2VuZXJhdGluZyBzaXRlbWFwOicsIGVycm9yKTtcbiAgICB9XG4gIH1cbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKSwgc2l0ZW1hcFBsdWdpbigpXSxcbiAgYnVpbGQ6IHtcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgdmVuZG9yOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ10sXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn0pOyJdLAogICJtYXBwaW5ncyI6ICI7Ozs7OztBQUFBO0FBQXFQLE9BQU8sUUFBUTtBQUNwUSxPQUFPLFdBQVc7QUFLbEIsZUFBZSxzQkFBc0I7QUFDbkMsTUFBSTtBQUNGLFVBQU0sV0FBVyxNQUFNO0FBQUEsTUFDckIsR0FBRyxZQUFZO0FBQUEsTUFDZjtBQUFBLFFBQ0UsU0FBUztBQUFBLFVBQ1AsaUJBQWlCLFVBQVUsaUJBQWlCO0FBQUEsVUFDNUMsZ0JBQWdCO0FBQUEsUUFDbEI7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUVBLFFBQUksQ0FBQyxTQUFTLElBQUk7QUFDaEIsWUFBTSxJQUFJLE1BQU0sNEJBQTRCLFNBQVMsVUFBVSxFQUFFO0FBQUEsSUFDbkU7QUFFQSxVQUFNLFVBQVUsTUFBTSxTQUFTLEtBQUs7QUFDcEMsVUFBTSxHQUFHLFVBQVUsc0JBQXNCLE9BQU87QUFDaEQsWUFBUSxJQUFJLDhCQUE4QjtBQUFBLEVBQzVDLFNBQVMsT0FBTztBQUNkLFlBQVEsTUFBTSwyQkFBMkIsS0FBSztBQUM5QyxZQUFRLEtBQUssQ0FBQztBQUFBLEVBQ2hCO0FBQ0Y7QUE3QkEsSUFHTSxjQUNBO0FBSk47QUFBQTtBQUdBLElBQU0sZUFBZSxRQUFRLElBQUk7QUFDakMsSUFBTSxvQkFBb0IsUUFBUSxJQUFJO0FBMkJ0Qyx3QkFBb0I7QUFBQTtBQUFBOzs7QUMvQnFNLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQUlsQixJQUFNLGdCQUFnQixPQUFPO0FBQUEsRUFDM0IsTUFBTTtBQUFBLEVBQ04sTUFBTSxjQUFjO0FBQ2xCLFFBQUk7QUFDRixZQUFNLEVBQUUscUJBQUFBLHFCQUFvQixJQUFJLE1BQU07QUFDdEMsWUFBTUEscUJBQW9CO0FBQUEsSUFDNUIsU0FBUyxPQUFPO0FBQ2QsY0FBUSxNQUFNLDZCQUE2QixLQUFLO0FBQUEsSUFDbEQ7QUFBQSxFQUNGO0FBQ0Y7QUFFQSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxHQUFHLGNBQWMsQ0FBQztBQUFBLEVBQ2xDLE9BQU87QUFBQSxJQUNMLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQSxVQUNaLFFBQVEsQ0FBQyxTQUFTLGFBQWEsa0JBQWtCO0FBQUEsUUFDbkQ7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogWyJmZXRjaEFuZFNhdmVTaXRlbWFwIl0KfQo=
