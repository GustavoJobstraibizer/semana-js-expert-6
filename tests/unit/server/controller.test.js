import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import config from '../../../server/config';
import { Controller } from '../../../server/controller';
import { Service } from '../../../server/service';
import TestUtil from '../_util/testUtils';
const { pages } = config

describe('#Controller - test suite for controller', () => {
    beforeEach(() => {
        jest.restoreAllMocks()
        jest.clearAllMocks()
    })

    it('should return a file stream', async () => {
        const mockFileStream = TestUtil.generateReadableStream(['data'])
        const controller = new Controller()
        const expectedType = '.html'

        const jestMock = jest.spyOn(
            Service.prototype,
            Service.prototype.getFileStream.name
        ).mockReturnValue({
            stream: mockFileStream,
            type: expectedType
        })

        const controllerResult = await controller.getFileStream(pages.homeHTML)

        expect(jestMock).toBeCalledWith(pages.homeHTML)
        expect(controllerResult).toStrictEqual({
            stream: mockFileStream,
            type: expectedType
        })
    })
})