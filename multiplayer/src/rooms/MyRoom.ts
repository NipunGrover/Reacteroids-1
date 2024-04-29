import { Room, Client } from "@colyseus/core";
import { GameState, RockState, COMMON_PIXELS, INVALID } from "./schema/MyRoomState";

export class MyRoom extends Room<GameState> {
  maxClients = 4;

  onCreate (options: any) {
    // start a room with asteroids at level 1 (4 asteroids)
    this.setState(new GameState(1));

    this.onMessage("hit", (client, message) => {
      let [type, index, x, y] = message;
      console.log("hit", type, index);
      if (type == "rock") {
        this.destroyRock (index, x, y);
      }
    });

    this.onMessage("start", (client, message) => {
      this.state = new GameState(1);
    })

    this.setSimulationInterval((deltaTime) => this.update(deltaTime));
  }
  // let's test out handling moves on the client side!
  // asteroids move in a fixed direction from a fixed starting point
  // we should be fine as long as we sync creating and destroying them

  // server tick
  update(deltaTime: number) {
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

  onJoin (client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    this.state.setDirty("level");
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

  createRock (radius: number, x: number, y: number) {
    if (radius >= 10) {
      this.state.rocks.push(new RockState(x, y, radius, this.state.level));
    }
  }

  destroyRock (index: number, x: number, y: number) {
    this.broadcast("destroy", ["rock", index, x, y]);
    // rather than delete, mark invalid
    if (index >= this.state.rocks.length) {
      console.log("asteroid position", index, "does not exist");
      return;
    }
    let a = this.state.rocks[index];
    if (a.radius > 10) {
      this.createRock (a.radius/2, x, y);
      this.createRock (a.radius/2, x, y);
      console.log("broadcasting create rock", x, y);
      this.broadcast("create", ["rock", this.state.rocks]);
    }
    this.state.rocks.splice(index, 1);
    console.log("state change", this.state.rocks.length);
  }
}
