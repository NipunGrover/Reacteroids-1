import Particle from "./Particle";
import { randomNumBetween, getCoordinates } from "../utils/functions";

export default class Asteroid {
  constructor(args) {
    this.position = {
      x: getCoordinates(args.stats.position.x, window.innerWidth),
      y: getCoordinates(args.stats.position.y, window.innerHeight),
    };
    this.velocity = {
      x: getCoordinates(args.stats.speed.x, window.innerWidth),
      y: getCoordinates(args.stats.speed.y, window.innerHeight),
    };
    this.rotation = args.stats.rotation;
    this.rotationSpeed = args.stats.spin;
    this.radius = args.stats.size;
    this.score = (80 / this.radius) * 5;
    this.create = args.create;
    this.addScore = args.addScore;
    this.vertices = args.stats.vertices;
  }

  destroy() {
    this.delete = true;
    this.addScore(this.score);

    // Explode
    for (let i = 0; i < this.radius; i++) {
      const particle = new Particle({
        lifeSpan: randomNumBetween(60, 100),
        size: randomNumBetween(1, 3),
        position: {
          x: this.position.x + randomNumBetween(-this.radius / 4, this.radius / 4),
          y: this.position.y + randomNumBetween(-this.radius / 4, this.radius / 4),
        },
        velocity: {
          x: randomNumBetween(-1.5, 0.1),
          y: randomNumBetween(-1.5, 0.1),
        },
      });
      this.create(particle, "particles");
    }

    // Break into smaller asteroids
    if (this.radius > 10) {
      for (let i = 0; i < 2; i++) {
        let asteroid = new Asteroid({
          size: this.radius / 2,
          position: {
            x: randomNumBetween(-10, 20) + this.position.x,
            y: randomNumBetween(-10, 20) + this.position.y,
          },
          create: this.create.bind(this),
          addScore: this.addScore.bind(this),
        });
        this.create(asteroid, "asteroids");
      }
    }
  }

  render(state) {
    // Draw
    const context = state.context;
    context.save();
    context.translate(this.position.x, this.position.y);
    context.rotate((this.rotation * Math.PI) / 180);
    context.strokeStyle = "#FFF";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, -this.radius);
    for (let i = 1; i < this.vertices.length; i++) {
      context.lineTo(this.vertices[i].x, this.vertices[i].y);
    }
    context.closePath();
    context.stroke();
    context.restore();
  }
}
