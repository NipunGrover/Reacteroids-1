import { ArraySchema, Schema, Context, type } from "@colyseus/schema";

// clients all have different resolutions
// we need to translate their relative x,y coordinates into common values
// common coordinates are calculated (value * COMMON_PIXELS / window_pixels)
// might be best to define this magic number elsewhere but it's here for now
export const COMMON_PIXELS: number = 1024;

// here's a special co-ordinate value to check for
export const INVALID: number = -1;

// speed limit on rocks
const MAX_V: number = 1;

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

// This state represents 1 player
export class PlayerState extends Schema {
  // status, position, and heading of player ship
  @type("string") status: string = "ok"; // "ok" or "dead"
  @type("number") x: number;
  @type("number") y: number;
  @type("number") r: number;

  constructor(x: number, y: number, r: number) {
    // players won't start off dead, don't need status in constructor... yet
    super();
    this.x = x;
    this.y = y;
    this.r = r;
  }
}

// This state represents all of the rocks in the level
// It uses arrays internally for size, position, and velocity of each
export class RockState extends Schema {
  static MAX_SIZE: number = 3;

  // size, position, and movement of rocks... heading doesn't really matter
  // player ship positions are updated by the client but rocks depend on game room I think
  @type(["number"]) size: number[];
  @type(["number"]) x: number[];
  @type(["number"]) y: number[];
  @type(["number"]) dx: number [];
  @type(["number"]) dy: number [];

  constructor (level: number = 1) {
    // create a bunch of random rock positions at the start of each level
    // starting difficulty is 4
    super();
    const rocks: number = level + 3;
    this.size = new ArraySchema<number>(...(new Array<number>(rocks).fill(RockState.MAX_SIZE)));

    this.x = new ArraySchema<number>(...Array<number>(rocks).fill(INVALID));
    this.y = new ArraySchema<number>(...Array<number>(rocks).fill(INVALID));
    this.dx = new ArraySchema<number>(...Array<number>(rocks).fill(0));
    this.dy = new ArraySchema<number>(...Array<number>(rocks).fill(0));

    for (var i = 0; i < rocks; i++) {
      this.x[i] = randomCoord();
      this.y[i] = randomCoord();
      this.dx[i] = randomSpeed(MAX_V + level);
      this.dy[i] = randomSpeed(MAX_V + level);
    }
  }
}

export class GameState extends Schema {
  @type([PlayerState]) players: PlayerState[];
  @type(RockState) rocks: RockState;
  @type("number") level: number = 1;

  constructor() {
    super();
    this.rocks = new RockState(this.level);
    this.players = new ArraySchema<PlayerState>(...(new Array<PlayerState>));
  }
}