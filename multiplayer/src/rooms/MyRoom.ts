import { Room, Client } from "@colyseus/core";
import { PlayerState, RockState } from "./schema/MyRoomState";

export class MyRoom extends Room<RockState> {
  maxClients = 4;

  onCreate (options: any) {
    // start a room with asteroids at level 1 (4 asteroids)
    this.setState(new RockState(1));

    this.onMessage("type", (client, message) => {
      //
      // handle "type" message
      //
    });
  }

  onJoin (client: Client, options: any) {
    console.log(client.sessionId, "joined!");
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}
