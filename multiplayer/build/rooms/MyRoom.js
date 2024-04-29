"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyRoom = void 0;
const core_1 = require("@colyseus/core");
const MyRoomState_1 = require("./schema/MyRoomState");
class MyRoom extends core_1.Room {
    constructor() {
        super(...arguments);
        this.maxClients = 4;
    }
    onCreate(options) {
        // start a room with asteroids at level 1 (4 asteroids)
        this.setState(new MyRoomState_1.GameState(1));
        this.onMessage("hit", (client, message) => {
            let type, index;
            [type, index] = message;
            console.log("hit", type, index);
            if (type == "rock") {
                this.destroyRock(index);
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
        //    this.moveRocks(deltaTime);
    }
    /*
      // update asteroid positions
      moveRocks(deltaTime: number) {
        for (let i = 0; i < this.state.rocks.length; i++) {
          let r: RockState = this.state.rocks[i];
          if (r.radius > INVALID) {
    //        console.log("updating:", r.x, r.y);
            // should multiply dx/dy by deltaTime
            if (r.position.x+r.speed.x < 0) {
              r.position.x = COMMON_PIXELS-r.speed.x;
            } else {
              r.position.x = (r.position.x+r.speed.x) % COMMON_PIXELS;
            }
            if (r.position.y+r.speed.y < 0) {
              r.position.y = COMMON_PIXELS-r.speed.y;
            } else {
              r.position.y = (r.position.y+r.speed.y) % COMMON_PIXELS;
            }
          }
        }
      }
    */
    onJoin(client, options) {
        console.log(client.sessionId, "joined!");
        this.state.setDirty("level");
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
    tooSmall(element, index, array) {
        return element.radius <= 10;
    }
    destroyRock(index) {
        // rather than delete, mark invalid
        if (index >= this.state.rocks.length) {
            console.log("asteroid position", index, "does not exist");
            return;
        }
        let a = this.state.rocks[index];
        if (a.radius > 10) {
            this.createRock(a.radius / 2, a.position.x, a.position.y);
            this.createRock(a.radius / 2, a.position.x, a.position.y);
        }
        this.state.rocks.splice(index, 1);
        this.state.setDirty("rocks");
    }
}
exports.MyRoom = MyRoom;
