import { describe, expect, it, jest } from "@jest/globals";
import events from "events";
import fs from "fs";
import { join } from "path";
import portfinder from "portfinder";
import { Transform } from "stream";
import supertest from "supertest";
import { setTimeout } from "timers/promises";
import config from "../../../server/config";
import Server from "../../../server/server.js";

const {
  location,
  pages: { homeHTML, controllerHTML },
  dir: { publicDirectory },
} = config;

const getAvailablePort = portfinder.getPortPromise;
const RETENTION_DATA_PERIOD = 200;
const commandResponse = JSON.stringify({
  result: "ok",
});
const possibleCommands = {
  start: "start",
  stop: "stop",
};

describe("API E2E Suite Test", () => {
  function pipeAndReadStreamData(stream, onChunk) {
    const transform = new Transform({
      transform(chunk, encoding, callback) {
        onChunk(chunk);
        callback(null, chunk);
      },
    });

    return stream.pipe(transform);
  }

  describe("Cliente workflow", () => {
    async function getTestServer() {
      const getSuperTest = (port) => supertest(`http://localhost:${port}`);
      const port = await getAvailablePort();
      return new Promise((resolve, reject) => {
        const server = Server().listen(port)
          .once("listening", () => {
            const testServer = getSuperTest(port);
            const response = {
              testServer,
              kill() {
                server.close();
              },
            };

            return resolve(response);
          })
          .once("error", reject);
      });
    }

    function commandSender(testServer) {
      return {
        async send(command) {
          const response = await testServer.post("/controller").send({
            command,
          });

          expect(response.text).toStrictEqual(commandResponse);
        },
      };
    }

    it("should not receive data stream if the process is not playing", async () => {
      const server = await getTestServer();
      const onChunk = jest.fn();

      pipeAndReadStreamData(server.testServer.get("/stream"), onChunk);

      await setTimeout(RETENTION_DATA_PERIOD);
      server.kill();
      expect(onChunk).not.toHaveBeenCalled();
    });

    it("should receive data stream if the process is playing", async () => {
      const server = await getTestServer();
      const onChunk = jest.fn();

      const { send } = commandSender(server.testServer);

      pipeAndReadStreamData(server.testServer.get("/stream"), onChunk);

      await send(possibleCommands.start);
      await setTimeout(RETENTION_DATA_PERIOD);
      await send(possibleCommands.stop);
      const [[buffer]] = onChunk.mock.calls;

      server.kill();

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(1000);
    });

    it("GET /home - should receive index.html file and status code 200", async () => {
      const server = await getTestServer();
      const expectedFile = fs
        .readFileSync(join(publicDirectory, homeHTML))
        .toString();
      const result = await server.testServer.get(location.home);

      server.kill();

      expect(result.text).toStrictEqual(expectedFile);
      expect(result.statusCode).toStrictEqual(200);
    });

    it("GET /controller - should receive index.html file and status code 200", async () => {
      const server = await getTestServer();
      const expectedFile = fs
        .readFileSync(join(publicDirectory, controllerHTML))
        .toString();
      const result = await server.testServer.get(location.controller);

      server.kill();

      expect(result.text).toStrictEqual(expectedFile);
      expect(result.statusCode).toStrictEqual(200);
    });

    it("POST /controller - should receive a stream", async () => {
      const server = await getTestServer();
      const result = await server.testServer
        .post(location.controller)
        .send({ command: "start" });

      const expectedResult = { result: "ok" };

      jest.spyOn(events, "once").mockResolvedValue({ command: "start" });

      server.kill();

      expect(JSON.parse(result.text)).toStrictEqual(expectedResult);
      expect(result.statusCode).toStrictEqual(200);
    });

    it("GET /styles.css - should receive a .css file and status code 200", async () => {
        const server = await getTestServer();
        const expectedFile = fs
          .readFileSync(join(publicDirectory, 'home', 'css', 'styles.css'))
          .toString();
        const result = await server.testServer.get(`${location.home}/css/styles.css`);

        server.kill();

        expect(result.text).toStrictEqual(expectedFile);
        expect(result.statusCode).toStrictEqual(200);
        expect(result.headers['content-type']).toStrictEqual('text/css');
      });

      describe('#Exceptions', () => {
          it('should respond with 404 given an inexistent route', async () => {
            const server = await getTestServer();
            const result = await server.testServer.get('/unknown');
            
            server.kill();

            expect(result.statusCode).toStrictEqual(404);
          })
      })
  });
});
