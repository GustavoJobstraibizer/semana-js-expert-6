import config from './config.js';
import server from './server.js';
import { logger } from './utils.js';

server.listen(config.port).on('listening', () => {
    logger.info(`server is running on port ${config.port}`);
})