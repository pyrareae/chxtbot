import { build } from "bun";

// Build the client-side bundle
await build({
  entrypoints: ["./src/ui/index.tsx"],
  outdir: "./public",
  naming: {
    entry: "index.js",
  },
  minify: true,
  plugins: [],
  target: "browser",
});

console.log("✅ Client-side bundle built successfully!"); 