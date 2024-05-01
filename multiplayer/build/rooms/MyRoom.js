"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyRoom = void 0;
const core_1 = require("@colyseus/core");
const MyRoomState_1 = require("./schema/MyRoomState");
class MyRoom extends core_1.Room {
    constructor() {
        super(...arguments);
        // remember which client owns which ship
        this.players = new Map();
    }
    onCreate(options) {
        // start a room with asteroids at level 1 (4 asteroids)
        this.setState(new MyRoomState_1.GameState(1));
        this.onMessage("hit", (client, message) => {
            let [type, index, x, y] = message;
            console.log("hit", type, index);
            if (type == "rock") {
                this.destroyRock(index, x, y);
            }
            else if (type == "ship") {
                if (this.players.has(client.id)) {
                    index = this.players.get(client.id);
                    console.log("destroy ship:", this.state.ships[index]);
                    this.state.ships.splice(index, 1);
                    this.players.delete(client.id);
                }
            }
        });
        this.onMessage("ship", (client, message) => {
            let [x, y, r] = message;
            const index = this.players.get(client.id);
            console.log("set player ship", client.id, index);
            if (isNaN(index)) {
                console.log("push values", x, y, r);
                this.state.ships.push(new MyRoomState_1.ShipState(new MyRoomState_1.XY(x, y), r));
                this.players.set(client.id, this.state.ships.length - 1);
            }
            else {
                console.log("update values", x, y, r);
                var update = this.state.ships[index];
                update.pos = new MyRoomState_1.XY(x, y);
                update.rtn = r;
            }
        });
        this.onMessage("start", (client, message) => {
            this.state = new MyRoomState_1.GameState(1);
        });
        this.setSimulationInterval((deltaTime) => this.update(deltaTime));
    }
    // let's test out handling moves on the client side!
    // asteroids move in a fixed direction from a fixed starting point
    // we should be fine as long as we sync creating and destroying them
    // server tick
    update(deltaTime) {
        this.moveRocks(deltaTime);
    }
    // update asteroid positions
    moveRocks(deltaTime) {
        for (let i = 0; i < this.state.rocks.length; i++) {
            let r = this.state.rocks[i];
            //console.log("updating:", i);
            // should multiply dx/dy by deltaTime
            r.rotation = (r.rotation + r.spin) % 360;
            if (r.position.x + r.speed.x < 0) {
                r.position.x = MyRoomState_1.COMMON_PIXELS - r.position.x;
            }
            else {
                r.position.x = (r.position.x + r.speed.x) % MyRoomState_1.COMMON_PIXELS;
            }
            if (r.position.y + r.speed.y < 0) {
                r.position.y = MyRoomState_1.COMMON_PIXELS - r.position.y;
            }
            else {
                r.position.y = (r.position.y + r.speed.y) % MyRoomState_1.COMMON_PIXELS;
            }
        }
    }
    onJoin(client, options) {
        console.log(client.sessionId, "joined!");
    }
    onLeave(client, consented) {
        console.log(client.sessionId, "left!");
    }
    onDispose() {
        console.log("room", this.roomId, "disposing...");
    }
    createRock(radius, x, y) {
        if (radius >= 10) {
            this.state.rocks.push(new MyRoomState_1.RockState(x, y, radius, this.state.level));
        }
    }
    // commenting out broadcasts / messages no longer needed if we move asteroids server-side
    destroyRock(index, x, y) {
        // we get full asteroid info on state updates so no need to broadcast
        //     this.broadcast("destroy", ["rock", index]);
        if (index >= this.state.rocks.length) {
            console.log("asteroid position", index, "does not exist");
            return;
        }
        let a = this.state.rocks[index];
        if (a.radius > 10) {
            this.createRock(a.radius / 2, a.position.x, a.position.y);
            this.createRock(a.radius / 2, a.position.x, a.position.y);
            //      console.log("broadcasting create rock", x, y);
            //      this.broadcast("create", ["rock", this.state.rocks]);
        }
        this.state.rocks.splice(index, 1);
        console.log("state change", this.state.rocks.length);
    }
}
exports.MyRoom = MyRoom;
