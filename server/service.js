import childProcess from 'child_process';
import { randomUUID } from 'crypto';
import { once } from 'events';
import fs from 'fs';
import fsPromises from 'fs/promises';
import { extname, join } from 'path';
import { PassThrough, Writable } from 'stream';
import streamsPromises from 'stream/promises';
import Throttle from 'throttle';
import config from './config.js';
import { logger } from './utils.js';

const { constants: { fallBackBitRate, englishConversation, bitRateDivisor } } = config

const { dir: { publicDirectory } } = config

export class Service {
    constructor() {
        this.clientStreams = new Map()
        this.currentSong = englishConversation
        this.currentBitRate = 0
        this.throttleTransform = {}
        this.currentReadable = {}
    }

    createClientStream() {
        const id = randomUUID()
        const clientStream = new PassThrough();
        this.clientStreams.set(id, clientStream);

        return {
            id,
            clientStream
        }
    }

    removeClientStream(id) {
        this.clientStreams.delete(id)
    }

    _executeSoxCommand(args) {
        return childProcess.spawn('sox', args)
    }

    broadCast() {
        return new Writable({
            write: (chunk, encoding, callback) => {
                for (const [id, stream] of this.clientStreams) {
                    // Se o cliente se desconectar, ele não receberá mais nada
                    if (stream.writableEnd) {
                        this.clientStreams.delete(id)
                        continue;
                    }

                    stream.write(chunk)
                }

                callback()
            }
        })
    }

    async startStream() {
        logger.info(`starting stream with ${this.currentSong}`)
        const bitRate = this.currentBitRate = await this.getBitRate(this.currentSong) / bitRateDivisor
        const throttleTransform = this.throttleTransform = new Throttle(bitRate)
        const songReadable = this.currentReadable = this.createFileStream(this.currentSong)

        return streamsPromises.pipeline(
            songReadable,
            throttleTransform,
            this.broadCast()
        )
    }

    async stopStream() {
        logger.info(`stopping stream`)
        this.throttleTransform?.end()
    }

    async getBitRate(song) {
        try {
            const args = [
                '--i', // info
                '-B', // bitrate
                song
            ]
            const {
                stdout, // tudo que é log
                stderr, // tudo que é erro
                // stdin // enviar dados como stream
            } = this._executeSoxCommand(args)

            await Promise.all([
                once(stdout, 'readable'),
                once(stderr, 'readable'),
            ])

            const [success, error] = [stdout, stderr].map(stream => stream.read())
            if (error) return await Promise.reject(error)

            return success
                .toString()
                .trim()
                .replace(/k/i, '000')
        } catch (error) {
            logger.error(`Error getting bitrate: ${error}`)
            return fallBackBitRate
        }
    }

    createFileStream(file) {
        return fs.createReadStream(file);
    }

    async getFileInfo(file) {
        const fullFilePath = join(publicDirectory, file);
        
        // validate if file exists
        await fsPromises.access(fullFilePath);
        const fileType = extname(fullFilePath)

        return {
            type: fileType,
            name: fullFilePath
        }
    }
    
    async getFileStream(file) {
        const { type, name } = await this.getFileInfo(file);
        
        return {
            stream: this.createFileStream(name),
            type
        }
    }
}