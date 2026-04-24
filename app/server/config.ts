export interface AppConfig {
  port: number;
  appOrigin: string;
  homeRoot: string;
  stateDir: string;
  documentServerPublicOrigin: string;
  deployUid: string;
}

export function loadConfig(): AppConfig {
  const port = Number(process.env.PORT || '3000');
  const appOrigin = (process.env.APP_ORIGIN || `http://localhost:${port}`).replace(/\/+$/, '');
  const homeRoot = process.env.HOME_ROOT || '/lzcapp/document';
  const stateDir = process.env.STATE_DIR || '/lzcapp/var/state';
  const documentServerPublicOrigin = (process.env.DOCUMENT_SERVER_PUBLIC_ORIGIN || '').replace(/\/+$/, '');
  const deployUid = (process.env.DEPLOY_UID || process.env.LAZYCAT_APP_DEPLOY_UID || '').trim();

  return {
    port,
    appOrigin,
    homeRoot,
    stateDir,
    documentServerPublicOrigin,
    deployUid
  };
}
