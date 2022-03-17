import { describe, expect, it, jest } from '@jest/globals';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import config from '../../../server/config';
import { Service } from '../../../server/service.js';
import TestUtil from '../_util/testUtils.js';

const {
    dir: { publicDirectory }
} = config

describe('#Service - Test suite for Service layer', () => {
    it('should create a file stream', () => {
        const service = new Service()
        const file = '/index.html'

        jest.spyOn(
            fs,
            'createReadStream'
        ).mockReturnValue(file)

        service.createFileStream('/index.html')

        expect(fs.createReadStream).toHaveBeenCalledWith('/index.html')
    })

    it('should return a file info', async () => {
        const service = new Service()
        const file = '/index.html'
        const expectedType = '.html'
        const expectFullFilePath = publicDirectory + file

        jest.spyOn(
            path,
            'join'
        ).mockReturnValue(expectFullFilePath)

        jest.spyOn(
            fsPromises,
            'access'
        ).mockResolvedValue()

        jest.spyOn(
            path,
            'extname'
        ).mockReturnValue(expectedType)

        const result = await service.getFileInfo(file)

        expect(result).toEqual({
            name: expectFullFilePath,
            type: expectedType
        })
    })

    it('should return a file stream', async () => {
        const service = new Service()
        const mockFileStream = TestUtil.generateReadableStream(['data'])
        const excpectedType = '.html'

        jest.spyOn(
            service,
            'getFileInfo'
        ).mockReturnValue({
            name: '/index.html',
            type: excpectedType
        })

        jest.spyOn(
            service,
            'createFileStream'
        ).mockReturnValue(mockFileStream)

        const result = await service.getFileStream('/index.html')

        expect(result).toStrictEqual({
            stream: mockFileStream,
            type: excpectedType
        })
    })
})