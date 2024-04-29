"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameState = exports.RockState = exports.XY = exports.asteroidVerticesXY = exports.INVALID = exports.COMMON_PIXELS = void 0;
const schema_1 = require("@colyseus/schema");
// clients all have different resolutions
// we need to translate their relative x,y coordinates into common values
// common coordinates are calculated (value * COMMON_PIXELS / window_pixels)
// might be best to define this magic number elsewhere but it's here for now
exports.COMMON_PIXELS = 1024;
// here's a special co-ordinate value to check for
exports.INVALID = -1;
// speed limit on rocks
const MAX_V = 1;
// return a random coordinate on the play field
// it's 1024*1024 common pixels so this works in x or y
function randomCoord() {
    return Math.round(Math.random() * exports.COMMON_PIXELS);
}
// get a random starting speed on a vector for the rock
// add up two random numbers to create a distribution
function randomSpeed(limit) {
    // we'll multiply our speed value by 1 or -1
    const dir = (Math.round(Math.random()) === 0) ? 1 : -1;
    return dir * (Math.random() + Math.random()) * limit;
}
function asteroidVerticesXY(count, radius) {
    var p = new Array(count);
    for (let i = 0; i < count; i++) {
        p[i] = new XY((-Math.sin((360 / count) * i * Math.PI / 180) + Math.round(Math.random() * 2 - 1) * Math.random() / 3) * radius, (-Math.cos((360 / count) * i * Math.PI / 180) + Math.round(Math.random() * 2 - 1) * Math.random() / 3) * radius);
    }
    return p;
}
exports.asteroidVerticesXY = asteroidVerticesXY;
;
// this seems made-up but ok whatever
class XY extends schema_1.Schema {
    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
    }
}
exports.XY = XY;
__decorate([
    (0, schema_1.type)("number")
], XY.prototype, "x", void 0);
__decorate([
    (0, schema_1.type)("number")
], XY.prototype, "y", void 0);
// This state represents all of the rocks in the level
// It uses arrays internally for size, position, and velocity of each
class RockState extends schema_1.Schema {
    static { this.MAX_SIZE = 80; }
    // args is a map of x, y, size
    constructor(x, y, size, level) {
        super();
        this.position = new XY(x, y);
        this.speed = new XY(randomSpeed(MAX_V + level), randomSpeed(MAX_V + level));
        this.radius = size;
        this.spin = Math.random() * 2 - 1; //-1 to +1
        this.vertices = asteroidVerticesXY(8, this.radius);
        // do we need these here? there's gotta be a better way
        /*
        this.r = 0;
        this.score = (80/this.radius)*5;
        this.create = args.create;
        this.addScore = args.addScore;
        */
    }
}
exports.RockState = RockState;
__decorate([
    (0, schema_1.type)(XY)
], RockState.prototype, "position", void 0);
__decorate([
    (0, schema_1.type)(XY)
], RockState.prototype, "speed", void 0);
__decorate([
    (0, schema_1.type)([XY])
], RockState.prototype, "vertices", void 0);
__decorate([
    (0, schema_1.type)("number")
], RockState.prototype, "radius", void 0);
__decorate([
    (0, schema_1.type)("number")
], RockState.prototype, "spin", void 0);
class GameState extends schema_1.Schema {
    constructor(level = 1) {
        super();
        //  @type([BulletState]) bullets: BulletState[];
        this.level = 1;
        this.level = level;
        this.rocks = new schema_1.ArraySchema(...(new Array));
        //    this.players = new ArraySchema<PlayerState>(...(new Array<PlayerState>));
        //    this.bullets = new ArraySchema<BulletState>(...(new Array<BulletState>));
        for (let i = 0; i < this.level + 3; i++) {
            this.rocks.push(new RockState(randomCoord(), randomCoord(), RockState.MAX_SIZE, this.level));
        }
        ;
    }
}
exports.GameState = GameState;
__decorate([
    (0, schema_1.type)([RockState])
], GameState.prototype, "rocks", void 0);
__decorate([
    (0, schema_1.type)("number")
], GameState.prototype, "level", void 0);
