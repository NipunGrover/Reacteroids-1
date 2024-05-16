import { Room, Client } from "@colyseus/core";
import { GameState, ShipState, XY } from "./schema/MyRoomState";

export class MyRoom extends Room<GameState> {
  maxClients = 4;
  players: Map<string, number> = new Map<string, number>();
  onCreate(options: any) {
    this.setState(new GameState());

    this.onMessage("ship", (client, message) => {
      let [x, y, rotation] = message;
      if (this.players.has(client.id)) {
        const index = this.players.get(client.id);
        if (index < this.state.ships.length) {
          this.state.ships[index].position = new XY(x, y);
          this.state.ships[index].rotation = rotation;
        } else {
          this.players.delete(client.id);
        }
      } else {
        this.state.ships.push(new ShipState(new XY(x, y), rotation));
        this.players.set(client.id, this.state.ships.length - 1);
      }
    });

    this.onMessage("collision", (client, message) => {
      let [type, index, x, y] = message;

      if (type == "ship") {
        this.players.clear();

        this.state.ships.splice(0, this.state.ships.length);
      }
    });

    this.onMessage("start", (client, message) => {
      this.state = new GameState();
    });

    this.setSimulationInterval((deltaTime) => this.update(deltaTime));
  }

  update(deltaTime: number) {}
  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");

    if (this.players.has(client.id)) {
      console.log(client.sessionId, "HAS INDEX!");
      const index = this.players.get(client.id);
      this.players.delete(client.id);
      if (index < this.state.ships.length) {
        console.log(client.sessionId, "HAS SLICE!");

        this.state.ships.slice(index, 1);
      }
    }
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}
