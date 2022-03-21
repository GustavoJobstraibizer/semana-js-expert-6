import config from './config.js';
import server from './server.js';
import { logger } from './utils.js';

server().listen(config.port).on('listening', () => {
    logger.info(`server is running on port ${config.port}`);
})

// impede que o app caia, caso um erro não seja tratado
// uncaughtException => throw
// unhandledRejection => Promises
process.on('uncaughtException', (error) => logger.error(`uncaughtException: ${error}`));
process.on('unhandledRejection', (error) => logger.error(`unhandledRejection: ${error}`));