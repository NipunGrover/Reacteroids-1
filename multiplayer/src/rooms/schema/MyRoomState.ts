import { Schema, type, ArraySchema } from "@colyseus/schema";

export const COMMON_RESOLUTION: number = 1024;

export class XY extends Schema {
  @type("number") x: number;
  @type("number") y: number;

  constructor(x: number, y: number) {
    super();
    this.x = x;
    this.y = y;
  }
}

export class PlayerState extends Schema {
  @type("string") id: string;

  constructor(id: string) {
    super();
    this.id = id;
  }
}

export class AsteroidState extends Schema {
  @type(XY) position: XY;
  @type(XY) speed: XY;
  @type("number") rotation: number;
  @type("number") size: number;
  @type("number") spin: number;
  @type([XY]) vertices: Array<XY>;

  constructor(x: number, y: number, size: number, level: number) {
    super();
    this.position = new XY(x, y);
    this.speed = randomSpeed(level);
    this.rotation = 0;
    this.size = size;
    this.spin = Math.random() * (Math.round(Math.random()) === 0 ? 3 : -3);
    this.vertices = asteroidVerticesXY(8, this.size);
  }
}

export class GameState extends Schema {
  @type("number") level: number;
  @type([PlayerState]) players: PlayerState[];
  @type([AsteroidState]) asteroids: AsteroidState[];

  constructor(level: number = 1) {
    super();
    this.level = level;
    this.asteroids = new ArraySchema<AsteroidState>(...new ArraySchema<AsteroidState>());
    this.generateAsteroids();
  }

  generateAsteroids() {
    for (let i = 0; i < this.level + 2; i++) {
      this.asteroids.push(new AsteroidState(randomCoordinate(), randomCoordinate(), 80, this.level));
    }
  }
}

const randomCoordinate = (): number => Math.round(Math.random() * COMMON_RESOLUTION);

const randomSpeed = (level: number): XY => {
  const limit = level;
  const dir = Math.round(Math.random()) === 0 ? 1 : -1;
  const speed = dir * Math.random() * limit;
  return new XY(speed, speed);
};

const asteroidVerticesXY = (count: number, radius: number): Array<XY> => {
  let arr: Array<XY> = new Array<XY>(count);
  for (let i = 0; i < count; i++) {
    arr[i] = new XY(
      (-Math.sin(((360 / count) * i * Math.PI) / 180) + (Math.round(Math.random() * 2 - 1) * Math.random()) / 3) * radius,
      (-Math.cos(((360 / count) * i * Math.PI) / 180) + (Math.round(Math.random() * 2 - 1) * Math.random()) / 3) * radius
    );
  }
  return arr;
};
