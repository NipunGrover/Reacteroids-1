import { COMMON_RESOLUTION } from "../../multiplayer/src/rooms/schema/MyRoomState";
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

export function getCoordinate(coord, resolution) {
  return Math.round((coord * COMMON_RESOLUTION) / resolution);
}
