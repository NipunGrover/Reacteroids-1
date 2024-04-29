import Particle from './Particle';
import { getCoordinates, randomNumBetween } from '../utils/functions';

export default class Asteroid {
  // we use RockState from the server
  // position, speed, radius, spin, vertices
  constructor(args) {
    // translate [1024,1024] common pixels to fit screen resolution
    console.log("asteroid constructor", args.stats);
    this.position = {
      x: getCoordinates(args.stats.position.x, window.innerWidth), 
      y: getCoordinates(args.stats.position.y, window.innerHeight)
    };
    this.speed = {
      x: getCoordinates(args.stats.speed.x, window.innerWidth),
      y: getCoordinates(args.stats.speed.y, window.innerHeight)
    };
    this.radius = args.stats.radius;
    this.rotationSpeed = args.stats.spin;
    this.rotation = 0;
    this.vertices = args.stats.vertices;
    this.score = (80/args.stats.radius)*5;
    this.create = args.create;
    this.addScore = args.addScore;
  }

  destroy(){
//  delete asteroids when the server says to!
//    this.delete = true;
    this.addScore(this.score);
    const p = this.position;
    const r = this.radius;

    // Explode
    for (let i = 0; i < this.radius; i++) {
      const particle = new Particle({
        lifeSpan: randomNumBetween(60, 100),
        size: randomNumBetween(1, 3),
        position: {
          x: p.x + randomNumBetween(-r/4, r/4),
          y: p.y + randomNumBetween(-r/4, r/4)
        },
        velocity: {
          x: randomNumBetween(-1.5, 0.1),
          y: randomNumBetween(-1.5, 0.1)
        }
      });
      this.create(particle, 'particles');
    }
    // move code for creating smaller asteroids into server
  }

  render(state){
    // Move is handled client side, 
    // update server state only when we add/destroy rocks if possible

    if (isNaN(this.speed.x) || isNaN(this.speed.y)) {
      console.log("stuck asteroid?", this);
    }
    
    this.position.x += this.speed.x;
    this.position.y += this.speed.y;

    // Rotation
    this.rotation += this.rotationSpeed;
    if (this.rotation >= 360) {
      this.rotation -= 360;
    }
    if (this.rotation < 0) {
      this.rotation += 360;
    }

    // Screen edges ... why are my asteroids getting stuck on screen edges?
    this.position.x %= state.screen.width;
    if (this.position.x < this.radius) this.position.x = state.screen.width - this.position.x;
    this.position.y %= state.screen.height;
    if (this.position.y < this.radius) this.position.y = state.screen.height - this.position.y;

    // Draw
    const context = state.context;
    context.save();
    context.translate(this.position.x, this.position.y);
    context.rotate(this.rotation * Math.PI / 180);
    context.strokeStyle = '#FFF';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, -this.radius);
    for (let i = 0; i < this.vertices.length; i++) {
      context.lineTo(this.vertices[i].x, this.vertices[i].y);
    }
    context.closePath();
    context.stroke();
    context.restore();
  }
}
