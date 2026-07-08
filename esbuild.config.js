// Bundles the MAIN MCP server entry point (src/index.ts) into a single
// self-contained dist/index.js so `npm install` from the registry works without
// a build step at install time and server spawn doesn't pay node_modules
// resolution cost. my-pm only spawns this main entry.
//
// The 4 sub-server bins (mcp-jira-core, mcp-jira-agile, mcp-jira-dashboard,
// mcp-jira-search) are NOT bundled here — they stay on the tsc multi-file
// build (see "build:core" etc. in package.json), since my-pm doesn't use them
// and bundling all 5 entry points adds complexity with no consumer benefit.
//
// Node builtins are bundled as ESM imports by esbuild, but CJS deps that call
// require() internally (e.g. dotenv, and this entry's own createRequire read of
// package.json for serverInfo.version) need a require() shim in ESM output —
// hence the banner injecting createRequire. This entry has no shebang line in
// source, so the banner also injects one.
import { build } from 'esbuild';

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'dist/index.js',
  banner: {
    js: "#!/usr/bin/env node\nimport { createRequire as __createRequire } from 'module';\nconst require = __createRequire(import.meta.url);",
  },
});
