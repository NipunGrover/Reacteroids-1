import { ArraySchema, Schema, Context, type } from "@colyseus/schema";

// export class MyRoomState extends Schema {
  
// @type("string") mySynchronizedProperty: string = "Hello world";



// }
export class XY extends Schema {
  @type("number") x: number;
  @type("number") y: number;

  constructor (x: number, y: number) {
    super();
    this.x = x;
    this.y = y;
  }
}



export class ShipState extends Schema{

@type(XY) position:XY;
@type("number") rotation:number;
 constructor (position: XY, rotation: number) {
    super();
    this.position = position;
    this.rotation = rotation;
  }

}

export class PlayerState extends Schema{
@type("string") id:string;
@type(ShipState) ship:ShipState;

 constructor (playerId: string) {
    super();
    this.id = playerId;
    this.ship = new ShipState(new XY(0,0),0);
  }

}

export class GameState extends Schema{

@type([PlayerState]) ships: PlayerState[];

  constructor()
  {
    super();
    this.ships = new ArraySchema<PlayerState>(...(new ArraySchema()));
  }
}


