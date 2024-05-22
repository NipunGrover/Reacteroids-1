import {PlayerBullet} from "./Bullet";
import Particle from "./Particle";
import { rotatePoint, randomNumBetween, getCoordinates, lerp } from "../utils/functions";

export const OK = 0;
export const GHOST = 1;

let currentPosition = {
  x: 0,
  y: 0,
};

export class Ship {
  constructor(args) {
    this.position = {
      x: getCoordinates(args.position.x, window.innerWidth),
      y: getCoordinates(args.position.y, window.innerHeight),
    };
    this.rotation = args.rotation;
    this.radius = 20;
    this.create = args.create;
    this.colour = args.colour;
  }

  draw_ship(state, colour) {
    // Draw
    const context = state.context;
    context.save();
    context.translate(this.position.x, this.position.y);
    context.rotate((this.rotation * Math.PI) / 180);
    context.strokeStyle = colour;
    context.fillStyle = "#000000";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, -15);
    context.lineTo(10, 10);
    context.lineTo(5, 7);
    context.lineTo(-5, 7);
    context.lineTo(-10, 10);
    context.closePath();
    context.fill();
    context.stroke();
    context.restore();
  }

  explode() {
    // Explode
    for (let i = 0; i < 60; i++) {
      const particle = new Particle({
        lifeSpan: randomNumBetween(60, 100),
        size: randomNumBetween(1, 4),
        position: {
          x: this.position.x + randomNumBetween(-this.radius / 4, this.radius / 4),
          y: this.position.y + randomNumBetween(-this.radius / 4, this.radius / 4),
        },
        velocity: {
          x: randomNumBetween(-1.5, 1.5),
          y: randomNumBetween(-1.5, 1.5),
        },
      });
      this.create(particle, "particles");
    }
  }

  destroy() {
    this.explode();
  }

  render(state) {
    // console.log("rendering npc ship");
    this.draw_ship(state, this.colour);
  }
}

export class PlayerShip extends Ship {
  constructor(args) {
    super(args);
    this.velocity = {
      x: 0,
      y: 0,
    };
    this.rotationSpeed = 4;
    this.speed = 0.08;
    this.inertia = 0.99;
    this.radius = 20;
    this.lastShot = 0;
    this.onDie = args.onDie;
    this.mode = GHOST;
    window.setTimeout(() => {this.mode = OK;}, 1000);
  }

  rotate(dir) {
    if (dir == "LEFT") {
      this.rotation -= this.rotationSpeed;
    }
    if (dir == "RIGHT") {
      this.rotation += this.rotationSpeed;
    }
  }

  accelerate(val) {
    this.velocity.x -= Math.sin((-this.rotation * Math.PI) / 180) * this.speed;
    this.velocity.y -= Math.cos((-this.rotation * Math.PI) / 180) * this.speed;

    // Thruster particles
    let posDelta = rotatePoint({ x: 0, y: -10 }, { x: 0, y: 0 }, ((this.rotation - 180) * Math.PI) / 180);
    const particle = new Particle({
      lifeSpan: randomNumBetween(20, 40),
      size: randomNumBetween(1, 3),
      position: {
        x: this.position.x + posDelta.x + randomNumBetween(-2, 2),
        y: this.position.y + posDelta.y + randomNumBetween(-2, 2),
      },
      velocity: {
        x: posDelta.x / randomNumBetween(3, 5),
        y: posDelta.y / randomNumBetween(3, 5),
      },
      colour: this.colour
    });
    this.create(particle, "particles");
  }

  destroy() {
      this.onDie();
      this.explode();
  }

  render(state) {
    // render colour trail version of ship
    super.render(state);

    // Controls
    if (state.keys.up) {
      this.accelerate(1);
    }
    if (state.keys.left) {
      this.rotate("LEFT");
    }
    if (state.keys.right) {
      this.rotate("RIGHT");
    }
    if (state.keys.space && Date.now() - this.lastShot > 300) {
      const bullet = new PlayerBullet({ ship: this });
      this.create(bullet, "bullets");
      this.lastShot = Date.now();
    }

    // Move
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.velocity.x *= this.inertia;
    this.velocity.y *= this.inertia;

    // Rotation
    if (this.rotation >= 360) {
      this.rotation -= 360;
    }
    if (this.rotation < 0) {
      this.rotation += 360;
    }

    // Screen edges
    if (this.position.x > state.screen.width) this.position.x = 0;
    else if (this.position.x < 0) this.position.x = state.screen.width;
    if (this.position.y > state.screen.height) this.position.y = 0;
    else if (this.position.y < 0) this.position.y = state.screen.height;

    let drawColour = (this.mode == GHOST)? "#7F7F7F" : "#FFFFFF";
    this.draw_ship(state, drawColour);
  }
}
