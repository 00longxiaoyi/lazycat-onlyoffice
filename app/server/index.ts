import { loadConfig } from './config';
import { createServer } from './app';
import { initMiniDB } from './db/minidb';

const config = loadConfig();
initMiniDB(config);

const server = createServer(config);

server.listen(config.port, '0.0.0.0', () => {
  console.log(`ONLYOFFICE Lazycat app listening on :${config.port}`);
});
