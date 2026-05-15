{
  description = "UPS-LEIPS Analyzer development shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = pkgs.mkShell {
          packages = [
            pkgs.nodejs_24
            pkgs.corepack
            pkgs.pnpm
            pkgs.go
            pkgs.git
            pkgs.podman
            pkgs.podman-compose
          ];

          shellHook = ''
            export PATH="$PWD/node_modules/.bin:$PATH"
            export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
            export PODMAN_COMPOSE_PROVIDER=podman-compose
            corepack enable >/dev/null 2>&1 || true
            echo "UPS-LEIPS Analyzer dev shell"
            echo "Run once: pnpm install"
            echo "Then: vp dev"
            echo "Container: podman compose build && podman compose up"
            echo "macOS .app icon generation uses system iconutil and sips."
          '';
        };
      }
    );
}
