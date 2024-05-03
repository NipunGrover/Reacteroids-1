import { rotatePoint, getCoordinates } from '../utils/functions';

// used for bullets from other players in server state
export class Bullet {
  constructor(args) {
    // take simplified argument for construction
    if (args.pos) {
      this.position = {
        x: getCoordinates(args.pos.x, window.innerWidth),
        y: getCoordinates(args.pos.y, window.innerHeight)
      };
    }
    this.radius = 2;
  }

  destroy(){
    this.delete = true;
  }

  // Draw
  drawBullet(state, colour) {
    const context = state.context;
    context.save();
    context.translate(this.position.x, this.position.y);
    context.rotate(this.rotation * Math.PI / 180);
    context.fillStyle = colour;
    context.lineWidth = 0,5;
    context.beginPath();
    context.arc(0, 0, 2, 0, 2 * Math.PI);
    context.closePath();
    context.fill();
    context.restore();
  }
    
  render(state){
    // no need to manage position or expiry on this one
//    console.log("drawing bullet");
    this.drawBullet(state, '#D0D');
  }
}

// additional state and tracking for bullets fired by player
export class PlayerBullet extends Bullet {
  constructor(args) {
    let posDelta = rotatePoint({x:0, y:-20}, {x:0,y:0}, args.ship.rotation * Math.PI / 180);

    // set position on parent object
    super ({
      // empty
    });
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

  render(state){
    // Move
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // Delete if it goes out of bounds
    if ( this.position.x < 0
      || this.position.y < 0
      || this.position.x > state.screen.width
      || this.position.y > state.screen.height ) {
        this.destroy();
    }

    // Draw
    this.drawBullet(state, '#FFF');
  }
}