import { beforeEach, describe, it, jest } from '@jest/globals';
import config from '../../../server/config';
import { Controller } from '../../../server/controller';
import { handler } from '../../../server/routes';
import TestUtil from '../_util/testUtils';
const { location, pages, constants: { CONTENT_TYPE } } = config

describe('#Routes - Test site por api response', () => {
    beforeEach(() => {
        jest.restoreAllMocks()
        jest.clearAllMocks()
    })

    it('GET / should redirect to home page', async () => {
        const params = TestUtil.defaultHandleParams()
        params.request.method = 'GET'
        params.request.url = '/'

        await handler(...params.values())

        expect(params.response.writeHead).toHaveBeenCalledWith(302, {
            'Location': location.home
        })
        expect(params.response.end).toHaveBeenCalled()
    })

    it('GET /home should response with home/index.html file stream', async () => {
        const params = TestUtil.defaultHandleParams()
        params.request.method = 'GET'
        params.request.url = '/home'
        const mockFileStream = TestUtil.generateReadableStream(['data'])

        jest.spyOn(
            Controller.prototype,
            Controller.prototype.getFileStream.name
        ).mockResolvedValue({
            stream: mockFileStream
        })

        jest.spyOn(
            mockFileStream,
            'pipe'
        ).mockReturnValue()

        await handler(...params.values())

        expect(Controller.prototype.getFileStream).toBeCalledWith(pages.homeHTML)
        expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response)
    })

    it('GET /controller should response controller/index.html file stream', async () => {
        const params = TestUtil.defaultHandleParams()
        params.request.method = 'GET'
        params.request.url = '/controller'
        const mockFileStream = TestUtil.generateReadableStream(['data'])

        jest.spyOn(
            Controller.prototype,
            Controller.prototype.getFileStream.name
        ).mockResolvedValue({
            stream: mockFileStream
        })

        jest.spyOn(
            mockFileStream,
            'pipe'
        ).mockReturnValue()

        await handler(...params.values())

        expect(Controller.prototype.getFileStream).toBeCalledWith(pages.controllerHTML)
        expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response)
    })

    it('GET /file.css should response with a file stream', async () => {
        const params = TestUtil.defaultHandleParams()
        const fileName = '/file.css'
        params.request.method = 'GET'
        params.request.url = fileName
        const expectedType = '.css'
        const mockFileStream = TestUtil.generateReadableStream(['data'])

        jest.spyOn(
            Controller.prototype,
            Controller.prototype.getFileStream.name
        ).mockResolvedValue({
            stream: mockFileStream,
            type: expectedType
        })

        jest.spyOn(
            mockFileStream,
            'pipe'
        ).mockReturnValue()

        await handler(...params.values())

        expect(Controller.prototype.getFileStream).toBeCalledWith(fileName)
        expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response)
        expect(params.response.writeHead).toHaveBeenCalledWith(200, {
            'Content-Type': CONTENT_TYPE[expectedType]
        })
    })

    it('GET /file.ext should response with a file stream', async () => {
        const params = TestUtil.defaultHandleParams()
        const fileName = '/file.ext'
        params.request.method = 'GET'
        params.request.url = fileName
        const expectedType = '.ext'
        const mockFileStream = TestUtil.generateReadableStream(['data'])

        jest.spyOn(
            Controller.prototype,
            Controller.prototype.getFileStream.name
        ).mockResolvedValue({
            stream: mockFileStream,
            type: expectedType
        })

        jest.spyOn(
            mockFileStream,
            'pipe'
        ).mockReturnValue()

        await handler(...params.values())

        expect(Controller.prototype.getFileStream).toBeCalledWith(fileName)
        expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response)
        expect(params.response.writeHead).not.toHaveBeenCalled()
    })

    it('POST /unknown given an inexistent file should response with a 404', async () => {
        const params = TestUtil.defaultHandleParams()
        params.request.method = 'POST'
        params.request.url = '/unknown'

        await handler(...params.values())

        expect(params.response.writeHead).toHaveBeenCalledWith(404)
        expect(params.response.end).toHaveBeenCalled()
    })

    describe('exceptions', () => {
        it('given inexistent file it should respond with 404', async () => {
            const params = TestUtil.defaultHandleParams()
            params.request.method = 'GET'
            params.request.url = '/image.png'

            jest.spyOn(
                Controller.prototype,
                Controller.prototype.getFileStream.name
            ).mockRejectedValue(new Error('Error: ENOENT: no such file or directory'))

            await handler(...params.values())

            expect(params.response.writeHead).toHaveBeenCalledWith(404)
            expect(params.response.end).toHaveBeenCalled()
        })

        it('given an error file it should respond with 500', async () => {
            const params = TestUtil.defaultHandleParams()
            params.request.method = 'GET'
            params.request.url = '/image.png'

            jest.spyOn(
                Controller.prototype,
                Controller.prototype.getFileStream.name
            ).mockRejectedValue(new Error())

            await handler(...params.values())

            expect(params.response.writeHead).toHaveBeenCalledWith(500)
            expect(params.response.end).toHaveBeenCalled()
        })
    })
})