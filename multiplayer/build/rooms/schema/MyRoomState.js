"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RockState = exports.PlayerState = void 0;
const schema_1 = require("@colyseus/schema");
// clients all have different resolutions
// we need to translate their relative x,y coordinates into common values
// common coordinates are calculated (value * COMMON_PIXELS / window_pixels)
// might be best to define this magic number elsewhere but it's here for now
const COMMON_PIXELS = 1024;
// here's a special co-ordinate value to check for
const INVALID = -1;
// speed limit on rocks
const MAX_V = 1;
// return a random coordinate on the play field
// it's 1024*1024 common pixels so this works in x or y
function randomCoord() {
    return Math.round(Math.random() * COMMON_PIXELS);
}
// get a random starting speed on a vector for the rock
// add up two random numbers to create a distribution
function randomSpeed(limit) {
    // we'll multiply our speed value by 1 or -1
    const dir = (Math.round(Math.random()) === 0) ? 1 : -1;
    return dir * (Math.random() + Math.random()) * limit;
}
class PlayerState extends schema_1.Schema {
    constructor(x, y, r) {
        // players won't start off dead, don't need status in constructor... yet
        super();
        // status, position, and heading of player ship
        this.status = "ok"; // "ok" or "dead"
        this.x = x;
        this.y = y;
        this.r = r;
    }
}
exports.PlayerState = PlayerState;
__decorate([
    (0, schema_1.type)("string")
], PlayerState.prototype, "status", void 0);
__decorate([
    (0, schema_1.type)("number")
], PlayerState.prototype, "x", void 0);
__decorate([
    (0, schema_1.type)("number")
], PlayerState.prototype, "y", void 0);
__decorate([
    (0, schema_1.type)("number")
], PlayerState.prototype, "r", void 0);
class RockState extends schema_1.Schema {
    static { this.MAX_SIZE = 3; }
    constructor(level = 1) {
        // create a bunch of random rock positions at the start of each level
        // starting difficulty is 4
        super();
        const rocks = level + 3;
        this.size = new schema_1.ArraySchema(...(new Array(rocks).fill(RockState.MAX_SIZE)));
        this.x = new schema_1.ArraySchema(...Array(rocks).fill(INVALID));
        this.y = new schema_1.ArraySchema(...Array(rocks).fill(INVALID));
        this.dx = new schema_1.ArraySchema(...Array(rocks).fill(0));
        this.dy = new schema_1.ArraySchema(...Array(rocks).fill(0));
        for (var i = 0; i < level; i++) {
            this.x[i] = randomCoord();
            this.y[i] = randomCoord();
            this.dx[i] = randomSpeed(MAX_V + level);
            this.dy[i] = randomSpeed(MAX_V + level);
        }
    }
}
exports.RockState = RockState;
__decorate([
    (0, schema_1.type)(["number"])
], RockState.prototype, "size", void 0);
__decorate([
    (0, schema_1.type)(["number"])
], RockState.prototype, "x", void 0);
__decorate([
    (0, schema_1.type)(["number"])
], RockState.prototype, "y", void 0);
__decorate([
    (0, schema_1.type)(["number"])
], RockState.prototype, "dx", void 0);
__decorate([
    (0, schema_1.type)(["number"])
], RockState.prototype, "dy", void 0);
