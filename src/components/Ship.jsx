import Bullet from './Bullet';
import Particle from './Particle';
import { rotatePoint, randomNumBetween } from '../utils/functions';
import SuperBullet from './SuperBullet';

export default class Ship {
    

  constructor(args) {
    this.position = args.position
    this.velocity = {
      x: 0,
      y: 0
    }
    this.rotation = 0;
    this.rotationSpeed = 4;
    this.speed = 0.08;
    this.inertia = 0.99;
    this.radius = 20;
    this.lastShot = 0;
    this.create = args.create;
    this.onDie = args.onDie;
  }

  destroy(){
    this.delete = true;
    this.onDie();

    // Explode
    for (let i = 0; i < 60; i++) {
      const particle = new Particle({
        lifeSpan: randomNumBetween(60, 100),
        size: randomNumBetween(1, 4),
        position: {
          x: this.position.x + randomNumBetween(-this.radius/4, this.radius/4),
          y: this.position.y + randomNumBetween(-this.radius/4, this.radius/4)
        },
        velocity: {
          x: randomNumBetween(-1.5, 1.5),
          y: randomNumBetween(-1.5, 1.5)
        }
      });
      this.create(particle, 'particles');
    }
  }

  rotate(dir){
    if (dir == 'LEFT') {
      this.rotation -= this.rotationSpeed;
    }
    if (dir == 'RIGHT') {
      this.rotation += this.rotationSpeed;
    }
  }

  accelerate(val){
    this.velocity.x -= Math.sin(-this.rotation*Math.PI/180) * this.speed;
    this.velocity.y -= Math.cos(-this.rotation*Math.PI/180) * this.speed;

    // Thruster particles
    let posDelta = rotatePoint({x:0, y:-30}, {x:0,y:0}, (this.rotation-180) * Math.PI / 180);
    const particle = new Particle({
      lifeSpan: randomNumBetween(20, 40),
      size: randomNumBetween(1, 3),
      position: {
        x: this.position.x + posDelta.x + randomNumBetween(-2, 2),
        y: this.position.y + posDelta.y + randomNumBetween(-2, 2)
      },
      velocity: {
        x: posDelta.x / randomNumBetween(3, 5),
        y: posDelta.y / randomNumBetween(3, 5)
      },
      color: '#ff5706'
    });
    this.create(particle, 'particles');
  }

  // A function to draw a ship
  draw_ship(state, color){   
    const context = state.context;
    context.save();
    context.translate(this.position.x, this.position.y);
    context.rotate(this.rotation * Math.PI / 180);
    context.strokeStyle = color;
    context.fillStyle = '#AA336A';
    context.lineWidth = 2;
    // create rocket body
    context.beginPath();
    context.moveTo(0, -30);
    context.quadraticCurveTo(-15, 10, -25, 50);
    context.lineTo(25, 50);
    context.quadraticCurveTo(15, 10, 0, -30);
    context.closePath();
    context.fill();
    context.stroke();

     // rocket window
     context.beginPath();
     context.arc(0, 20, 7, 0, 2 * Math.PI);
     context.fillStyle = 'blue';
     context.fill();
     context.lineWidth = 2;
     context.strokeStyle = color;
     context.stroke();

     // rocket wings
     context.beginPath();
     context.moveTo(-25, 50);
     context.lineTo(-30, 60);
     context.lineTo(30, 60);
     context.lineTo(25, 50);
     context.closePath();
     context.fillStyle = 'black';
     context.fill();
     context.lineWidth = 2;
     context.strokeStyle = color;
     context.stroke();
     context.restore();
  }

  render(state){
    // Controls
    if(state.keys.up){
      this.accelerate(1);
    }
    if(state.keys.left){
      this.rotate('LEFT');
    }
    if(state.keys.right){
      this.rotate('RIGHT');
    }
    if(state.keys.space && !state.pinkState && Date.now() - this.lastShot > 300){
      const bullet = new Bullet({ship: this});
      this.create(bullet, 'bullets');
      this.lastShot = Date.now();
    }
    if(state.keys.space && state.pinkState && Date.now() - this.lastShot > 300){
      const superbullet = new SuperBullet({ship: this});
      this.create(superbullet, 'superbullets');
      this.lastShot = Date.now();
    }

    this.draw_ship(state, '#ff0096');

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
    if(this.position.x > state.screen.width) this.position.x = 0;
    else if(this.position.x < 0) this.position.x = state.screen.width;
    if(this.position.y > state.screen.height) this.position.y = 0;
    else if(this.position.y < 0) this.position.y = state.screen.height;

    this.draw_ship(state, '#FFF');
  }
}
