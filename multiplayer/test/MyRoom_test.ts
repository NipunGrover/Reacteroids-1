import assert from "assert";
import { ColyseusTestServer, boot } from "@colyseus/testing";

// import your "app.config.ts" file here.
import appConfig from "../src/app.config";
import { GameState, RockState, INVALID } from "../src/rooms/schema/MyRoomState";

describe("testing your Colyseus app", () => {
  let colyseus: ColyseusTestServer;

  before(async () => colyseus = await boot(appConfig));
  after(async () => colyseus.shutdown());

  beforeEach(async () => await colyseus.cleanup());

  it("connecting into a room", async () => {
    // `room` is the server-side Room instance reference.
    const room = await colyseus.createRoom<GameState>("my_room", {});

    // `client1` is the client-side `Room` instance reference (same as JavaScript SDK)
    const client1 = await colyseus.connectTo(room);

    // make your assertions
    assert.strictEqual(client1.sessionId, room.clients[0].sessionId);

    // wait for state sync
    await room.waitForNextPatch();

    const l: number = client1.state.rocks.length;
    const x: number = client1.state.rocks[l-1].position.x;
    const dx: number = client1.state.rocks[l-1].speed.x;

    assert.strictEqual(4, l);
    console.log(client1.state.rocks[0]);
    assert.notStrictEqual(INVALID, client1.state.rocks[l-1].position.x);
    assert.notStrictEqual(INVALID, client1.state.rocks[l-1].speed.y);
    assert.strictEqual(client1.state.rocks[l-1].radius, RockState.MAX_SIZE);
    assert.notStrictEqual(client1.state.rocks[l-1].spin, 0);

    client1.send("ship", [100, 100, 100]);

    await room.waitForNextPatch();

    const s = room.state.ships.length;
    assert.strictEqual(s, 1);
    assert.strictEqual(room.state.ships[s-1].pos.x, 100);
  });
});
