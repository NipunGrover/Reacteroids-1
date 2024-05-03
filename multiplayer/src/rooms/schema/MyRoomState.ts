import { MapSchema, ArraySchema, Schema, Context, type } from "@colyseus/schema";

// clients all have different resolutions
// we need to translate their relative x,y coordinates into common values
// common coordinates are calculated (value * COMMON_PIXELS / window_pixels)
// might be best to define this magic number elsewhere but it's here for now
export const COMMON_PIXELS: number = 1024;

// here's a special co-ordinate value to check for
export const INVALID: number = -1;

// return a random coordinate on the play field
// it's 1024*1024 common pixels so this works in x or y
function randomCoord(): number {
  return Math.round(Math.random()*COMMON_PIXELS);
}

// get a random starting speed on a vector for the rock
// add up two random numbers to create a distribution
function randomSpeed(limit: number): number {
  // we'll multiply our speed value by 1 or -1
  const dir = (Math.round(Math.random()) === 0) ? 1 : -1;
  return dir * (Math.random() + Math.random()) * limit;
}

export function asteroidVerticesXY(count: number, radius: number): XY[] {
  var p: Array<XY> = new Array<XY>(count);
  for (let i = 0; i < count; i++) {
    p[i] = new XY (
      (-Math.sin((360/count)*i*Math.PI/180) + Math.round(Math.random()*2-1)*Math.random()/3)*radius,
      (-Math.cos((360/count)*i*Math.PI/180) + Math.round(Math.random()*2-1)*Math.random()/3)*radius
    );
  }
  return p;
};

// this seems made-up but ok whatever
export class XY extends Schema {
  @type("number") x: number;
  @type("number") y: number;

  constructor (x: number, y: number) {
    super();
    this.x = x;
    this.y = y;
  }
}

// represent bullets
// like player ships we just get an update for each bullet
// this makes it zero effort to track positions and hits
// maybe we make it more efficient by batching bullet positions per message from each client
export class BulletState extends Schema {
  @type(XY) pos: XY;

  constructor (position: XY) {
    super();
    this.pos = position;
  }
}

// represent player ships 
// Since these are controlled basically all the time I guess we're stuck relaying position every frame
// At least we can skip tracking their speed vector
// Can't use a MapSchema except mapping string->string so these are getting arrayed instead
export class ShipState extends Schema {
  @type(XY) pos: XY;
  @type('number') rtn: number;

  constructor (position: XY, rotation: number) {
    super();
    this.pos = position;
    this.rtn = rotation;
  }
}

// This state represents all of the rocks in the level
// It uses arrays internally for size, position, and velocity of each
export class RockState extends Schema {
  static MAX_SIZE: number = 80;
  static MAX_V: number = 0.5;

  // size, position, and movement of rocks... heading doesn't really matter
  // player ship positions are updated by the client but rocks depend on game room I think
  @type(XY) position: XY;
  @type(XY) speed: XY;
  @type([XY]) vertices: XY[];
  @type("number") radius: number;
  @type("number") spin: number;
  @type("number") rotation: number;

  // args is a map of x, y, size
  constructor(x: number, y: number, size: number, level: number) {
    super();
    this.position = new XY(x, y);
    this.speed = new XY(randomSpeed(RockState.MAX_V + level/10), randomSpeed(RockState.MAX_V + level/10));
    this.radius = size;
    this.spin = Math.random()*2 -1; //-1 to +1
    this.vertices = asteroidVerticesXY(8, this.radius);
    this.rotation = 0;
  }
}

export class GameState extends Schema {
  @type([ShipState]) ships: ShipState[];
  @type([RockState]) rocks: RockState[];
  @type([BulletState]) bullets: BulletState[];
  @type("number") level: number = 1;

  constructor(level: number = 1) {
    super();
    this.level = level;
    this.rocks = new ArraySchema<RockState>(...(new Array<RockState>));
    this.ships = new ArraySchema<ShipState>(...(new Array<ShipState>));
    this.bullets = new ArraySchema<BulletState>(...(new Array<BulletState>));

    for (let i = 0; i < this.level+2; i++) {
      this.rocks.push (new RockState(
        randomCoord(), randomCoord(), RockState.MAX_SIZE, this.level
      ));
    };
  }
}