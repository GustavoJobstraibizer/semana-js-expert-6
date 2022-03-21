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

const { constants: { 
    fallBackBitRate,
    englishConversation,
    bitRateDivisor,
    audioMediaType,
    songVolume,
    fxVolume,
 } } = config

const { dir: { publicDirectory, fxDirectory } } = config

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

    async startStreamming() {
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

    async stopStreamming() {
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

    async readFxByName(fxName) {
        const songs = await fsPromises.readdir(fxDirectory);
        const choosenSong = songs.find(song => song.toLowerCase().includes(fxName))

        if (!choosenSong) return Promise.reject(`The song ${fxName} not found`)

        return join(fxDirectory, choosenSong)
    }

    appendFxStream(fx) {
        const throttleTransformable = new Throttle(this.currentBitRate)

        streamsPromises.pipeline(
            throttleTransformable,
            this.broadCast()
        )

        const unpipe = () => {
            const transformStream = this.mergeAudioStreams(fx, this.currentReadable)

            this.throttleTransform = throttleTransformable
            this.currentReadable = transformStream
            this.currentReadable.removeListener('unpipe', unpipe)

            streamsPromises.pipeline(
                transformStream,
                throttleTransformable
            )
        }

        this.throttleTransform.on('unpipe', unpipe)
        this.throttleTransform.pause()
        this.currentReadable.unpipe(this.throttleTransform)
    }

    mergeAudioStreams(song, readable) {
        const transformStream = PassThrough()
        const args = [
            '-t', audioMediaType,
            '-v', songVolume,
            // -m => merge -> "-" receber como stream
            '-m', '-',
            '-t', audioMediaType,
            '-v', fxVolume,
            song,
            '-t', audioMediaType,
            '-'
        ]

        const {
            stdout,
            stdin
        } = this._executeSoxCommand(args)

        // plugamos a stream de conversation
        // na entrada de dados do terminal
        streamsPromises.pipeline(
            readable,
            stdin
        )
        .catch(error => logger.error(`error on sending stream to sox: ${error}`))

        streamsPromises.pipeline(
            stdout,
            transformStream
        )
        .catch(error => logger.error(`error on receiving stream from sox: ${error}`))

        return transformStream
    }
}