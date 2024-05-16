import { ArraySchema, Schema, Context, type } from "@colyseus/schema";

// export class MyRoomState extends Schema {
export const COMMON_PIXELS: number = 1024;
// @type("string") mySynchronizedProperty: string = "Hello world";

// }
export class XY extends Schema {
  @type("number") x: number;
  @type("number") y: number;

  constructor(x: number, y: number) {
    super();
    this.x = x;
    this.y = y;
  }
}

export class ShipState extends Schema {
  @type(XY) position: XY;
  @type("number") rotation: number;
  constructor(position: XY, rotation: number) {
    super();
    this.position = position;
    this.rotation = rotation;
  }
}

export class GameState extends Schema {
  @type([ShipState]) ships: ShipState[];

  constructor() {
    super();
    this.ships = new ArraySchema<ShipState>(...new Array<ShipState>());
  }
}
