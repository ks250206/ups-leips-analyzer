import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const arch = process.argv[2] ?? "arm64";
const appName = "UPS-LEIPS Analyzer";
const bundleId = "io.github.ks250206.ups-leips-analyzer";
const binName = "ups-leips-analyzer";
const appDir = resolve("bin", `${appName}-darwin-${arch}.app`);
const contentsDir = join(appDir, "Contents");
const macosDir = join(contentsDir, "MacOS");
const resourcesDir = join(contentsDir, "Resources");
const iconsetDir = resolve("bin", "favicon.iconset");
const iconPath = join(resourcesDir, "favicon.icns");
const zipPath = resolve("bin", `${appName.replaceAll(" ", "-")}-darwin-${arch}.app.zip`);

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

if (process.platform !== "darwin") {
  throw new Error("macOS .app bundle generation requires macOS iconutil and sips");
}

mkdirSync("bin", { recursive: true });
rmSync(appDir, { recursive: true, force: true });
rmSync(iconsetDir, { recursive: true, force: true });
rmSync(zipPath, { force: true });
mkdirSync(macosDir, { recursive: true });
mkdirSync(resourcesDir, { recursive: true });
mkdirSync(iconsetDir, { recursive: true });

for (const size of [16, 32, 128, 256, 512]) {
  run("sips", [
    "-z",
    String(size),
    String(size),
    "-s",
    "format",
    "png",
    "public/favicon.ico",
    "--out",
    join(iconsetDir, `icon_${size}x${size}.png`),
  ]);
  run("sips", [
    "-z",
    String(size * 2),
    String(size * 2),
    "-s",
    "format",
    "png",
    "public/favicon.ico",
    "--out",
    join(iconsetDir, `icon_${size}x${size}@2x.png`),
  ]);
}

run("iconutil", ["-c", "icns", iconsetDir, "-o", iconPath]);
rmSync(iconsetDir, { recursive: true, force: true });

run("go", ["build", "-o", join(macosDir, binName), "."], {
  env: {
    ...process.env,
    CGO_ENABLED: "0",
    GOOS: "darwin",
    GOARCH: arch,
  },
});

writeFileSync(
  join(contentsDir, "Info.plist"),
  `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleExecutable</key>
  <string>${binName}</string>
  <key>CFBundleIconFile</key>
  <string>favicon</string>
  <key>CFBundleIdentifier</key>
  <string>${bundleId}</string>
  <key>CFBundleName</key>
  <string>${appName}</string>
  <key>CFBundleDisplayName</key>
  <string>${appName}</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>0.1.0</string>
  <key>CFBundleVersion</key>
  <string>0.1.0</string>
  <key>LSMinimumSystemVersion</key>
  <string>11.0</string>
  <key>LSUIElement</key>
  <true/>
</dict>
</plist>
`,
);

cpSync("public/favicon.ico", join(resourcesDir, "favicon.ico"));
run("codesign", ["--force", "--deep", "--sign", "-", appDir]);
run("ditto", ["--norsrc", "--noextattr", "-c", "-k", "--keepParent", appDir, zipPath], {
  env: { ...process.env, COPYFILE_DISABLE: "1" },
});
