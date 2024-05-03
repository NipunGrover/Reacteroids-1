import { Room, Client } from "@colyseus/core";
import { GameState, 
         RockState, 
         PlayerState, 
         ShipState, 
         BulletState, 
         COMMON_PIXELS, 
         XY
        } from "./schema/MyRoomState";

export class MyRoom extends Room<GameState> {
  // remember which client owns which ship
  players: Map<string, number> = new Map<string, number>();

  onCreate (options: any) {
    // start a room with asteroids at level 1 (4 asteroids)
    this.setState(new GameState(1));

    this.onMessage("hit", (client, message) => {
      let [type, index, x, y] = message;
//      console.log("hit", type, index);
      
      if (type == "rock") {
        // destroyRock does a lot of stuff
        this.destroyRock (index, x, y);
      } else if (type == "ship") {
        // erase data for eliminated player
        if (this.players.has(client.id)) {
          let index = this.players.get(client.id);
          this.state.players.splice(index, 1);
        }
      }
    });

    this.onMessage("ship", (client, message) => {
      let [x, y, r] = message;
//      console.log("tracking",this.state.ships.length,"for",this.players.size,"players");
      if (this.players.has(client.id)) {
        const index = this.players.get(client.id);
        if (index < this.state.players.length) {
          //console.log("update values for", index);
          this.state.players[index].ship.pos = new XY(x, y);
          this.state.players[index].ship.rtn = r;
        } else {
          // sometimes the index gets messed up?
          // choose nuclear option against the player index
          this.players.delete(client.id);
        }
      } else {
        //create state for new player and map the array to their id value
        //then create their ship in the PlayerState object
        this.state.players.push (new PlayerState(client.id));
        let index = this.state.players.length-1;
        this.players.set(client.id, index);
        this.state.players[index].ship = new ShipState(new XY(x, y), r);
      }
    });

    this.onMessage("shot", (client, message) => {
//      console.log("shot update", this.activeShots, message);
      if (this.players.has(client.id)) {
        let index = this.players.get(client.id);
        let positions = message;
        let bullets = this.state.players[index].bullets;

        // erase all bullets from this player and replace with new positions
        bullets.splice(0, bullets.length);
        for (let i = 0; i < positions.length; i++) {
          bullets.push (new BulletState(new XY(positions[i].x, positions[i].y)));
        }
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
    this.moveRocks(deltaTime);
  }

  // update asteroid positions
  moveRocks(deltaTime: number) {
    if (this.state.rocks.length === 0) {
      const lvl = this.state.level;
      this.setState(new GameState(lvl+1));
    } else for (let i = 0; i < this.state.rocks.length; i++) {
      let r: RockState = this.state.rocks[i];
      //console.log("updating:", i);
        // should multiply dx/dy by deltaTime
      r.rotation = (r.rotation + r.spin) % 360;

      if (r.position.x+r.speed.x < 0) { 
        r.position.x = COMMON_PIXELS-r.position.x; 
      } else {
        r.position.x = (r.position.x+r.speed.x) % COMMON_PIXELS;
      }
      if (r.position.y+r.speed.y < 0) { 
        r.position.y = COMMON_PIXELS-r.position.y; 
      } else {
        r.position.y = (r.position.y+r.speed.y) % COMMON_PIXELS;
      }
    }
  }

  onJoin (client: Client, options: any) {
    console.log(client.sessionId, "joined!");
  }

  // clean up player leaving: 
  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");

    // same as code from onMessage("hit" ...) 
    // we need to be careful to avoid a null ref
    if (this.players.has(client.id)) {
      // 1. their player map entry
      const index = this.players.get(client.id);
      this.players.delete(client.id);

      // 2. their npc ship entry
      if (index < this.state.players.length) {
        this.state.players.slice(index, 1);
      }
    }
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

  createRock (radius: number, x: number, y: number) {
    if (radius >= 10) {
      this.state.rocks.push(new RockState(x, y, radius, this.state.level));
    }
  }

  // commenting out broadcasts / messages no longer needed if we move asteroids server-side
  destroyRock (index: number, x: number, y: number) {
    // we get full asteroid info on state updates so no need to broadcast
//     this.broadcast("destroy", ["rock", index]);
    if (index >= this.state.rocks.length) {
      console.log("asteroid position", index, "does not exist");
      return;
    }
    let a = this.state.rocks[index];
    if (a.radius > 10) {
      this.createRock (a.radius/2, a.position.x, a.position.y);
      this.createRock (a.radius/2, a.position.x, a.position.y);
//      console.log("broadcasting create rock", x, y);
//      this.broadcast("create", ["rock", this.state.rocks]);
    }
    this.state.rocks.splice(index, 1);
//    console.log("state change", this.state.rocks.length);
  }
}
