// Plain stylesheet side-effect imports (`import "./dashboard.css"`). Next only
// declares `*.module.css`, so TS 2882 fires on these without this.
declare module "*.css";
