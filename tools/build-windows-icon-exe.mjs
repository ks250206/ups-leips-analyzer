import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const arch = process.argv[2] ?? "amd64";
const out = process.argv[3] ?? `bin/ups-leips-analyzer-windows-${arch}.exe`;
const resource = `resource_windows_${arch}.syso`;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed`);
  }
}

mkdirSync("bin", { recursive: true });

try {
  run("go", ["run", "github.com/akavel/rsrc@latest", "-ico", "public/favicon.ico", "-o", resource]);
  run("go", ["build", "-o", out, "."], {
    env: {
      ...process.env,
      CGO_ENABLED: "0",
      GOOS: "windows",
      GOARCH: arch,
    },
  });
} finally {
  rmSync(resolve(resource), { force: true });
}
