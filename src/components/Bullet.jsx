import { rotatePoint, getCoordinates, sendCoordinates } from '../utils/functions';

export class Bullet {
  constructor(args) {
    this.radius = 2;
    if (args) {
      this.position = {
        x: getCoordinates(args.position.x, window.innerWidth),
        y: getCoordinates(args.position.y, window.innerHeight)
      };
      this.colour = args.colour;
      this.radius = (args.size > 2)? args.size : 2;
      console.log ("bullet size", args.size);
    }
  }

  destroy(){
    this.delete = true;
  }

  drawBullet(state, colour) {

    const context = state.context;
    context.save();
    context.translate(this.position.x, this.position.y);
    context.rotate(this.rotation * Math.PI / 180);
    context.fillStyle = colour;
    context.lineWidth = 0,5;
    context.beginPath();
    context.arc(0, 0, this.radius, 0, this.radius * Math.PI);
    context.closePath();
    context.fill();
    context.restore();
  }
    
  render(state){
    this.drawBullet(state, this.colour);
  }
}

export class PlayerBullet extends Bullet {
  constructor(args) {
    let posDelta = rotatePoint({x:0, y:-20}, {x:0,y:0}, args.ship.rotation * Math.PI / 180);

    super ({position:{
        x: sendCoordinates(args.ship.position.x, window.innerWidth),
        y: sendCoordinates(args.ship.position.y, window.innerHeight)
      },
      colour: args.ship.colour,
      size: args.size,
    });
    this.rotation = args.ship.rotation;
    this.velocity = {
      x:posDelta.x / 2,
      y:posDelta.y / 2
    };
  }

  destroy(){
    this.delete = true;
  }
  
  render(state){
    super.render(state);
    window.navigator.mediaDevices
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    if ( this.position.x < 0
      || this.position.y < 0
      || this.position.x > state.screen.width
      || this.position.y > state.screen.height ) {
        this.destroy();
    }

    this.drawBullet(state, "#FFFFFF");
  }
}