import { Service } from "./service.js";
import { logger } from "./utils.js";

export class Controller {
    constructor() {
        this.service = new Service()
    }

    async getFileStream(filename) {
        return this.service.getFileStream(filename)
    }

    async handleCommand({ command }) {
        logger.info(`command received: ${command}`)

        const result = {
            result: 'ok',
        }
        
        const cmd = command.toLowerCase()
        if (cmd.includes('start')) {
            this.service.startStream()
            return result
        }

        if (cmd.includes('stop')) {
            this.service.stopStream()
            return result
        }
    }

    createClientStream() {
        const {
            id,
            clientStream
        } = this.service.createClientStream()

        const onClose = () => {
            logger.info(`closing connection of client ${id}`)
            this.service.removeClientStream(id)
        }

        return {
            stream: clientStream,
            onClose
        }
    }
}