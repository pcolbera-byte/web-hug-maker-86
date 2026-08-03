// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isLovableSandbox =
  process.env["LOVABLE_SANDBOX"] === "1" || !!process.env["DEV_SERVER__PROJECT_PATH"];

export default defineConfig({
  
  // Static-only output (no server) for GitHub Pages.
  // Inside Lovable the default Cloudflare build is kept; in CI (GitHub Actions)
  // nitro is skipped so vite build emits plain prerendered files in dist/client.
  nitro: isLovableSandbox ? undefined : false,
  tanstackStart: isLovableSandbox
    ? {}
    : {
        prerender: { enabled: true, crawlLinks: true },
        pages: [{ path: "/" }],
      },
});
