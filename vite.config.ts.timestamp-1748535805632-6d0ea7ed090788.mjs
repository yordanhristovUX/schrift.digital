// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
import fs from "fs/promises";
var sitemapPlugin = () => ({
  name: "sitemap-plugin",
  async closeBundle() {
    try {
      const baseUrl = "https://schrift.digital";
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const staticRoutes = [
        { path: "/", priority: "1.0", changefreq: "daily" },
        { path: "/about", priority: "0.8", changefreq: "monthly" },
        { path: "/supporter", priority: "0.8", changefreq: "monthly" },
        { path: "/login", priority: "0.5", changefreq: "monthly" },
        { path: "/register", priority: "0.5", changefreq: "monthly" }
      ];
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      staticRoutes.forEach((route) => {
        xml += `  <url>
`;
        xml += `    <loc>${baseUrl}${route.path}</loc>
`;
        xml += `    <lastmod>${today}</lastmod>
`;
        xml += `    <changefreq>${route.changefreq}</changefreq>
`;
        xml += `    <priority>${route.priority}</priority>
`;
        xml += `  </url>
`;
      });
      xml += "</urlset>";
      await fs.writeFile("public/sitemap.xml", xml);
      console.log("Static sitemap generated successfully");
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgZnMgZnJvbSAnZnMvcHJvbWlzZXMnO1xuXG4vLyBQbHVnaW4gdG8gZ2VuZXJhdGUgc3RhdGljIHNpdGVtYXAgZHVyaW5nIGJ1aWxkXG5jb25zdCBzaXRlbWFwUGx1Z2luID0gKCkgPT4gKHtcbiAgbmFtZTogJ3NpdGVtYXAtcGx1Z2luJyxcbiAgYXN5bmMgY2xvc2VCdW5kbGUoKSB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIEdlbmVyYXRlIHN0YXRpYyBzaXRlbWFwXG4gICAgICBjb25zdCBiYXNlVXJsID0gJ2h0dHBzOi8vc2NocmlmdC5kaWdpdGFsJztcbiAgICAgIGNvbnN0IHRvZGF5ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KCdUJylbMF07XG5cbiAgICAgIC8vIFN0YXRpYyByb3V0ZXMgd2l0aCB0aGVpciBwcmlvcml0aWVzXG4gICAgICBjb25zdCBzdGF0aWNSb3V0ZXMgPSBbXG4gICAgICAgIHsgcGF0aDogJy8nLCBwcmlvcml0eTogJzEuMCcsIGNoYW5nZWZyZXE6ICdkYWlseScgfSxcbiAgICAgICAgeyBwYXRoOiAnL2Fib3V0JywgcHJpb3JpdHk6ICcwLjgnLCBjaGFuZ2VmcmVxOiAnbW9udGhseScgfSxcbiAgICAgICAgeyBwYXRoOiAnL3N1cHBvcnRlcicsIHByaW9yaXR5OiAnMC44JywgY2hhbmdlZnJlcTogJ21vbnRobHknIH0sXG4gICAgICAgIHsgcGF0aDogJy9sb2dpbicsIHByaW9yaXR5OiAnMC41JywgY2hhbmdlZnJlcTogJ21vbnRobHknIH0sXG4gICAgICAgIHsgcGF0aDogJy9yZWdpc3RlcicsIHByaW9yaXR5OiAnMC41JywgY2hhbmdlZnJlcTogJ21vbnRobHknIH0sXG4gICAgICBdO1xuXG4gICAgICBsZXQgeG1sID0gJzw/eG1sIHZlcnNpb249XCIxLjBcIiBlbmNvZGluZz1cIlVURi04XCI/Plxcbic7XG4gICAgICB4bWwgKz0gJzx1cmxzZXQgeG1sbnM9XCJodHRwOi8vd3d3LnNpdGVtYXBzLm9yZy9zY2hlbWFzL3NpdGVtYXAvMC45XCI+XFxuJztcblxuICAgICAgLy8gQWRkIHN0YXRpYyByb3V0ZXNcbiAgICAgIHN0YXRpY1JvdXRlcy5mb3JFYWNoKHJvdXRlID0+IHtcbiAgICAgICAgeG1sICs9IGAgIDx1cmw+XFxuYDtcbiAgICAgICAgeG1sICs9IGAgICAgPGxvYz4ke2Jhc2VVcmx9JHtyb3V0ZS5wYXRofTwvbG9jPlxcbmA7XG4gICAgICAgIHhtbCArPSBgICAgIDxsYXN0bW9kPiR7dG9kYXl9PC9sYXN0bW9kPlxcbmA7XG4gICAgICAgIHhtbCArPSBgICAgIDxjaGFuZ2VmcmVxPiR7cm91dGUuY2hhbmdlZnJlcX08L2NoYW5nZWZyZXE+XFxuYDtcbiAgICAgICAgeG1sICs9IGAgICAgPHByaW9yaXR5PiR7cm91dGUucHJpb3JpdHl9PC9wcmlvcml0eT5cXG5gO1xuICAgICAgICB4bWwgKz0gYCAgPC91cmw+XFxuYDtcbiAgICAgIH0pO1xuXG4gICAgICB4bWwgKz0gJzwvdXJsc2V0Pic7XG5cbiAgICAgIC8vIFdyaXRlIHNpdGVtYXAgdG8gcHVibGljIGRpcmVjdG9yeVxuICAgICAgYXdhaXQgZnMud3JpdGVGaWxlKCdwdWJsaWMvc2l0ZW1hcC54bWwnLCB4bWwpO1xuICAgICAgY29uc29sZS5sb2coJ1N0YXRpYyBzaXRlbWFwIGdlbmVyYXRlZCBzdWNjZXNzZnVsbHknKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZ2VuZXJhdGluZyBzaXRlbWFwOicsIGVycm9yKTtcbiAgICB9XG4gIH1cbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKSwgc2l0ZW1hcFBsdWdpbigpXSxcbiAgYnVpbGQ6IHtcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgdmVuZG9yOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ10sXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn0pOyJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU4sU0FBUyxvQkFBb0I7QUFDdFAsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sUUFBUTtBQUdmLElBQU0sZ0JBQWdCLE9BQU87QUFBQSxFQUMzQixNQUFNO0FBQUEsRUFDTixNQUFNLGNBQWM7QUFDbEIsUUFBSTtBQUVGLFlBQU0sVUFBVTtBQUNoQixZQUFNLFNBQVEsb0JBQUksS0FBSyxHQUFFLFlBQVksRUFBRSxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBR25ELFlBQU0sZUFBZTtBQUFBLFFBQ25CLEVBQUUsTUFBTSxLQUFLLFVBQVUsT0FBTyxZQUFZLFFBQVE7QUFBQSxRQUNsRCxFQUFFLE1BQU0sVUFBVSxVQUFVLE9BQU8sWUFBWSxVQUFVO0FBQUEsUUFDekQsRUFBRSxNQUFNLGNBQWMsVUFBVSxPQUFPLFlBQVksVUFBVTtBQUFBLFFBQzdELEVBQUUsTUFBTSxVQUFVLFVBQVUsT0FBTyxZQUFZLFVBQVU7QUFBQSxRQUN6RCxFQUFFLE1BQU0sYUFBYSxVQUFVLE9BQU8sWUFBWSxVQUFVO0FBQUEsTUFDOUQ7QUFFQSxVQUFJLE1BQU07QUFDVixhQUFPO0FBR1AsbUJBQWEsUUFBUSxXQUFTO0FBQzVCLGVBQU87QUFBQTtBQUNQLGVBQU8sWUFBWSxPQUFPLEdBQUcsTUFBTSxJQUFJO0FBQUE7QUFDdkMsZUFBTyxnQkFBZ0IsS0FBSztBQUFBO0FBQzVCLGVBQU8sbUJBQW1CLE1BQU0sVUFBVTtBQUFBO0FBQzFDLGVBQU8saUJBQWlCLE1BQU0sUUFBUTtBQUFBO0FBQ3RDLGVBQU87QUFBQTtBQUFBLE1BQ1QsQ0FBQztBQUVELGFBQU87QUFHUCxZQUFNLEdBQUcsVUFBVSxzQkFBc0IsR0FBRztBQUM1QyxjQUFRLElBQUksdUNBQXVDO0FBQUEsSUFDckQsU0FBUyxPQUFPO0FBQ2QsY0FBUSxNQUFNLDZCQUE2QixLQUFLO0FBQUEsSUFDbEQ7QUFBQSxFQUNGO0FBQ0Y7QUFFQSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxHQUFHLGNBQWMsQ0FBQztBQUFBLEVBQ2xDLE9BQU87QUFBQSxJQUNMLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQSxVQUNaLFFBQVEsQ0FBQyxTQUFTLGFBQWEsa0JBQWtCO0FBQUEsUUFDbkQ7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
