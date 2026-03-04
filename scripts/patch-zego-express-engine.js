const fs = require("fs");
const path = require("path");

const pkgRoot = path.join(
  __dirname,
  "..",
  "node_modules",
  "zego-express-engine-reactnative",
  "lib",
);

const targets = [
  path.join(pkgRoot, "index.js"),
  path.join(pkgRoot, "ZegoExpressEngine.js"),
];

function patch(content) {
  // Make ESM resolution explicit for Node (expo config step).
  // Avoid patching if already fixed.
  return content
    .replace(
      "import ZegoExpressEngine from './ZegoExpressEngine'",
      "import ZegoExpressEngine from './ZegoExpressEngine.js'",
    )
    .replace(
      "import { ZegoSurfaceView, ZegoTextureView } from './ZegoRenderView'",
      "import { ZegoSurfaceView, ZegoTextureView } from './ZegoRenderView.js'",
    )
    .replace("export * from './ZegoExpressDefines'", "export * from './ZegoExpressDefines.js'")
    .replace(
      "import { ZegoExpressEngineImpl } from './impl/ZegoExpressEngineImpl'",
      "import { ZegoExpressEngineImpl } from './impl/ZegoExpressEngineImpl.js'",
    );
}

try {
  let changed = false;
  for (const target of targets) {
    if (!fs.existsSync(target)) continue;
    const before = fs.readFileSync(target, "utf8");
    const after = patch(before);
    if (after !== before) {
      fs.writeFileSync(target, after, "utf8");
      changed = true;
    }
  }
  if (changed) {
    // eslint-disable-next-line no-console
    console.log("[postinstall] Patched zego-express-engine-reactnative ESM imports");
  }
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn("[postinstall] Failed to patch zego-express-engine-reactnative:", e?.message || e);
  process.exit(0);
}

