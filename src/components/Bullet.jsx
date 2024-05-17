import { rotatePoint, getCoordinates } from '../utils/functions';

export class Bullet {
  constructor(args) {
    if (args) {
      this.position = {
        x: getCoordinates(args.position.x, window.innerWidth),
        y: getCoordinates(args.position.y, window.innerHeight)
      };
    }
    this.radius = 2;
  }

  destroy(){
    this.delete = true;
  }

  drawBullet(state) {

    const context = state.context;
    context.save();
    context.translate(this.position.x, this.position.y);
    context.rotate(this.rotation * Math.PI / 180);
    context.fillStyle = '#fff';
    context.lineWidth = 0,5;
    context.beginPath();
    context.arc(0, 0, 2, 0, 2 * Math.PI);
    context.closePath();
    context.fill();
    context.restore();
  }
    
  render(state){
    this.drawBullet(state);
  }
}
export class PlayerBullet extends Bullet {
  constructor(args) {

    let posDelta = rotatePoint({x:0, y:-20}, {x:0,y:0}, args.ship.rotation * Math.PI / 180);

    super ();
    this.position = {
      x: args.ship.position.x + posDelta.x,
      y: args.ship.position.y + posDelta.y}
    this.rotation = args.ship.rotation;
    this.velocity = {
      x:posDelta.x / 2,
      y:posDelta.y / 2
    };
    this.radius = 2;
  }

  destroy(){
    this.delete = true;
  }
  
  render(state){
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    if ( this.position.x < 0
      || this.position.y < 0
      || this.position.x > state.screen.width
      || this.position.y > state.screen.height ) {
        this.destroy();
    }

    this.drawBullet(state);
  }
}