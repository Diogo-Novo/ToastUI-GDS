{ pkgs, ... }:

{
  env.NODE_OPTIONS = "--openssl-legacy-provider";

  languages.javascript = {
    enable = true;
    npm = {
      enable = true;
      install.enable = true;
    };
  };

  packages = with pkgs; [
    harper # Comment Grammer
  ];

  scripts.build.exec = "clear && npm run build";
}
