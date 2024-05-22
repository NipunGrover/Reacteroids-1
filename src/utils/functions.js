import { COMMON_PIXELS } from "../../multiplayer/src/rooms/schema/MyRoomState";
/**
 * Rotate point around center on certain angle
 * @param {Object} p        {x: Number, y: Number}
 * @param {Object} center   {x: Number, y: Number}
 * @param {Number} angle    Angle in radians
 */

export function asteroidVertices(count, rad) {
  let p = [];
  for (let i = 0; i < count; i++) {
    p[i] = {
      x: (-Math.sin(((360 / count) * i * Math.PI) / 180) + (Math.round(Math.random() * 2 - 1) * Math.random()) / 3) * rad,
      y: (-Math.cos(((360 / count) * i * Math.PI) / 180) + (Math.round(Math.random() * 2 - 1) * Math.random()) / 3) * rad,
    };
  }
  return p;
}

/**
 * Rotate point around center on certain angle
 * @param {Object} p        {x: Number, y: Number}
 * @param {Object} center   {x: Number, y: Number}
 * @param {Number} angle    Angle in radians
 */
export function rotatePoint(p, center, angle) {
  return {
    x: (p.x - center.x) * Math.cos(angle) - (p.y - center.y) * Math.sin(angle) + center.x,
    y: (p.x - center.x) * Math.sin(angle) + (p.y - center.y) * Math.cos(angle) + center.y,
  };
}

/**
 * Random Number between 2 numbers
 */
export function randomNumBetween(min, max) {
  return Math.random() * (max - min + 1) + min;
}

/**
 * Random Number between 2 numbers excluding a certain range
 */
export function randomNumBetweenExcluding(min, max, exMin, exMax) {
  let random = randomNumBetween(min, max);
  while (random > exMin && random < exMax) {
    random = Math.random() * (max - min + 1) + min;
  }
  return random;
}

// we need to translate coordinates from the COMMON_PIXELS * COMMON_PIXELS game board : taken from Jonathan B
export function getCoordinates(serverCoordinate, localResolution) {
  return Math.round((serverCoordinate * localResolution) / COMMON_PIXELS);
}

// we need to translate coordinates back to the COMMON_PIXELS * COMMON_PIXELS game board: taken from Jonathan B
export function sendCoordinates(localCoordinate, localResolution) {
  return Math.round((localCoordinate * COMMON_PIXELS) / localResolution);
}

export function lerp(start, end, t) {
  return start * (1 - t) + end * t;
}

// generate colour value from session ID to distinguish players online
// converting 9-character room code to bright hex colours is hard
export function getSessionColour(id) {
  return "#0FCFAF";
}