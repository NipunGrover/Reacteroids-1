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

    this.setSimulationInterval(() => this.update());
  }

  onJoin(client: Client, options: any) {
    console.log("##", client.sessionId, "JOINED!");
  }

  onLeave(client: Client, consented: boolean) {
    console.log("##", client.sessionId, "LEFT!");
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
      if (asteroid.position.x > COMMON_RESOLUTION + asteroid.size) asteroid.position.x = -asteroid.size;
      else if (asteroid.position.x < -asteroid.size) asteroid.position.x = COMMON_RESOLUTION + asteroid.size;
      if (asteroid.position.y > COMMON_RESOLUTION + asteroid.size) asteroid.position.y = -asteroid.size;
      else if (asteroid.position.y < -asteroid.size) asteroid.position.y = COMMON_RESOLUTION + asteroid.size;
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
