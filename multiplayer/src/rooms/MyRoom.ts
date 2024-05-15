import { Room, Client } from "@colyseus/core";
import { GameState, AsteroidState, COMMON_RESOLUTION } from "./schema/MyRoomState";

export class MyRoom extends Room<GameState> {
  players: Map<string, number> = new Map<string, number>();

  onCreate(options: any) {
    this.setState(new GameState());

    this.onMessage("start", (client, message) => {
      this.state = new GameState();
    });

    this.onMessage("collision", (client, message) => {
      const [type, index, x, y] = message;

      if (type === "asteroid") this.destoryAsteroid(index, x, y);
      else if (type === "ship") this.state.players.splice(this.players.get(client.id), 1);
    });

    this.setSimulationInterval((tick) => this.update(tick));
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

  update(tick: number) {
    if (this.state.asteroids.length === 0) {
      this.state.level++;
      this.state.generateAsteroids();
      return;
    }
    this.moveAsteroids(tick);
  }

  moveAsteroids = (tick: number) => {
    for (let i = 0; i < this.state.asteroids.length; i++) {
      let asteroid: AsteroidState = this.state.asteroids[i];
      asteroid.rotation = (asteroid.rotation + asteroid.spin) % 360;

      asteroid.position.x = asteroid.position.x + asteroid.speed.x < 0 ? COMMON_RESOLUTION - asteroid.position.x : (asteroid.position.x + asteroid.speed.x) % COMMON_RESOLUTION;
      asteroid.position.y = asteroid.position.y + asteroid.speed.y < 0 ? COMMON_RESOLUTION - asteroid.position.y : (asteroid.position.y + asteroid.speed.y) % COMMON_RESOLUTION;
    }
  };

  destoryAsteroid = (index: number, x: number, y: number) => {
    if (index >= this.state.asteroids.length) return;

    const asteroid = this.state.asteroids[index];
    if (asteroid.size > 10) {
      this.splitAsteroid(asteroid.size / 2, asteroid.position.x, asteroid.position.y);
    }
    this.state.asteroids.splice(index, 1);
  };

  splitAsteroid = (size: number, x: number, y: number) => {
    this.state.asteroids.push(new AsteroidState(x, y, size, this.state.level));
    this.state.asteroids.push(new AsteroidState(x, y, size, this.state.level));
  };
}
