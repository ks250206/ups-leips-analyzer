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
            pkgs.go
            pkgs.git
          ];

          shellHook = ''
            corepack enable >/dev/null 2>&1 || true
            echo "UPS-LEIPS Analyzer dev shell"
            echo "Run: vp install && vp dev"
            echo "macOS .app icon generation uses system iconutil and sips."
          '';
        };
      }
    );
}
