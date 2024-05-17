import { Room, Client } from "@colyseus/core";
import { GameState, ShipState, BulletState, AsteroidState, PlayerState, XY, COMMON_PIXELS } from "./schema/MyRoomState";

export class MyRoom extends Room<GameState> {
  players: Map<string, number> = new Map<string, number>();

  onCreate(options: any) {
    this.setState(new GameState());

    this.onMessage("start", (client, message) => {
      this.state = new GameState();
    });

    this.onMessage("ship", (client, message) => {
      let [x, y, rotation] = message;
      if (this.players.has(client.id)) {
        const index = this.players.get(client.id);
        if (index < this.state.players.length) {
          this.state.players[index].ship.position = new XY(x, y);
          this.state.players[index].ship.rotation = rotation;
        } else {
          this.players.delete(client.id);
        }
      } else {
        this.state.players.push(new PlayerState(client.id));
        let index = this.state.players.length - 1;
        this.players.set(client.id, index);
        this.state.players[index].ship = new ShipState(new XY(x, y), rotation);

        // this.state.ships.push(new ShipState(new XY(x, y), rotation));
        // this.players.set(client.id, this.state.ships.length - 1);
      }
    });

    this.onMessage("collision", (client, message) => {
      const [type, index, x, y] = message;

      if (type === "asteroid") this.destoryAsteroid(index, x, y);
      else if (type === "ship") {
        if (this.players.has(client.id)) {
          let index = this.players.get(client.id);
          this.state.players.splice(index, 1);
        }
        // this.players.clear();
        // this.state.ships.splice(0, this.state.ships.length);
      }
    });

    this.onMessage("bullet", (client, message) => {
      if (this.players.has(client.id)) {
        let index = this.players.get(client.id);
        let positions = message;
        let bullets = this.state.players[index].bullets;

        bullets.splice(0, bullets.length);
        for (let i = 0; i < positions.length; i++) {
          bullets.push (new BulletState(new XY(positions[i].x, positions[i].y)));
        }
      }
    });


    this.setSimulationInterval(() => this.update());
  }

  onJoin(client: Client, options: any) {
    console.log("##", client.sessionId, "JOINED!");
  }

  onLeave(client: Client, consented: boolean) {
    console.log("##", client.sessionId, "LEFT!");

    if (this.players.has(client.id)) {
      const index = this.players.get(client.id);
      this.players.delete(client.id);

      if (index < this.state.players.length) {
        this.state.players.slice(index, 1);
      }
    }
  }

  onDispose() {
    console.log("## ROOM", this.roomId, "DISPOSING..");
  }

  update() {
    // When the current level is cleared, level up and re-generate the asteroids.
    if (this.state.asteroids.length === 0) {
      this.state.level++;
      this.state.generateAsteroids();
    }
    this.moveAsteroids();
  }

  moveAsteroids = () => {
    for (let i = 0; i < this.state.asteroids.length; i++) {
      let asteroid: AsteroidState = this.state.asteroids[i];

      // Rotation
      asteroid.rotation = (asteroid.rotation + asteroid.spin) % 360;

      // Move
      asteroid.position.x += asteroid.speed.x;
      asteroid.position.y += asteroid.speed.y;

      // Screen edges
      if (asteroid.position.x > COMMON_PIXELS + asteroid.size) asteroid.position.x = -asteroid.size;
      else if (asteroid.position.x < -asteroid.size) asteroid.position.x = COMMON_PIXELS + asteroid.size;
      if (asteroid.position.y > COMMON_PIXELS + asteroid.size) asteroid.position.y = -asteroid.size;
      else if (asteroid.position.y < -asteroid.size) asteroid.position.y = COMMON_PIXELS + asteroid.size;
    }
  };

  // Destroy a asteroid when hit by a bullet
  destoryAsteroid = (index: number, x: number, y: number) => {
    if (index >= this.state.asteroids.length) return;

    const asteroid = this.state.asteroids[index];
    if (asteroid.size > 10) {
      this.splitAsteroid(asteroid.size / 2, asteroid.position.x, asteroid.position.y);
    }
    this.state.asteroids.splice(index, 1);
  };

  // Split a large asteroid
  splitAsteroid = (size: number, x: number, y: number) => {
    this.state.asteroids.push(new AsteroidState(x, y, size, this.state.level));
    this.state.asteroids.push(new AsteroidState(x, y, size, this.state.level));
  };
}
