import React, { Component } from 'react';
import { Ship, PlayerShip } from './Ship';
import Asteroid from './Asteroid';
import { Client, Room } from 'colyseus.js';
import { GameState, INVALID } from '../../multiplayer/src/rooms/schema/MyRoomState';
import { sendCoordinates } from '../utils/functions';

const COLYSEUS_HOST = 'ws://10.144.18.24:2567';
const GAME_ROOM = 'my_room';
const client = new Client (COLYSEUS_HOST);

const KEY = {
  LEFT:  37,
  RIGHT: 39,
  UP: 38,
  A: 65,
  D: 68,
  W: 87,
  SPACE: 32,
  ESCAPE: 27
};

export class Reacteroids extends Component {
  constructor() {
    super();

    // move createOrJoinRoom code to startGame

    this.state = {
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
      },
      context: null,
      keys : {
        left  : 0,
        right : 0,
        up    : 0,
        down  : 0,
        space : 0,
      },
      currentScore: 0,
      topScore: localStorage['topscore'] || 0,
      inGame: false
    }
    this.ship = []; // ship[0] should be player ship
    this.asteroids = [];
    this.bullets = [];
    this.particles = [];
  }

  handleResize(value, e){
    this.setState({
      screen : {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
      }
    });
  }

  handleKeys(value, e){
    let keys = this.state.keys;
    if(e.keyCode === KEY.LEFT   || e.keyCode === KEY.A) keys.left  = value;
    if(e.keyCode === KEY.RIGHT  || e.keyCode === KEY.D) keys.right = value;
    if(e.keyCode === KEY.UP     || e.keyCode === KEY.W) keys.up    = value;
    if(e.keyCode === KEY.SPACE) keys.space = value;
    this.setState({
      keys : keys
    });

    // force quit
    if(e.keyCode === KEY.ESCAPE) {
      this.gameOver();
    }
  }

  componentDidMount() {
    window.addEventListener('keyup',   this.handleKeys.bind(this, false));
    window.addEventListener('keydown', this.handleKeys.bind(this, true));
    window.addEventListener('resize',  this.handleResize.bind(this, false));

    const context = this.refs.canvas.getContext('2d');
    this.setState({ context: context });

    requestAnimationFrame(() => {this.update()});
  }

  componentWillUnmount() {
    window.removeEventListener('keyup', this.handleKeys);
    window.removeEventListener('keydown', this.handleKeys);
    window.removeEventListener('resize', this.handleResize);
  }

  async update() {
    const context = this.state.context;
    const keys = this.state.keys;
    const ship = this.ship[0];

    context.save();
    context.scale(this.state.screen.ratio, this.state.screen.ratio);

    // Motion trail
    context.fillStyle = '#000';
    context.globalAlpha = 0.1;
    context.fillRect(0, 0, this.state.screen.width, this.state.screen.height);
    context.globalAlpha = 1;
/*
    // Next set of asteroids
    if(!this.asteroids.length){
      let count = this.state.asteroidCount + 1;
      this.setState({ asteroidCount: count });
      this.generateAsteroids(count)
    }
*/
    // Check for colisions
    this.checkCollisions(this.bullets, this.asteroids);
    this.checkCollisionsWithShip(this.ship, this.asteroids);

    // Remove or render
    this.updateObjects(this.particles, 'particles')
    this.updateObjects(this.asteroids, 'asteroids')
    this.updateObjects(this.bullets, 'bullets')
    this.updateObjects(this.ship, 'ship')

    if (this.room && ship) {
      this.room.send("ship", [ship.position.x, ship.position.y, ship.rotation]);
    }

    context.restore();

    requestAnimationFrame(() => {this.update()});
  }

  addScore(points){
    if(this.state.inGame){
      this.setState({
        currentScore: this.state.currentScore + points,
      });
    }
  }

  startGame(){
    this.setState({
      inGame: true,
      currentScore: 0,
    });

    client.joinOrCreate(GAME_ROOM, {}, GameState).then(room => {
      console.log(room.sessionId, "joined", room.name, room.state);
      this.room = room;
      this.room.onStateChange((newState) => { 
//        console.log("state updated!");
        this.game_state = newState;
        this.generateAsteroids(newState.rocks);
        this.generateShips(newState.ships);
        console.log("ships to draw:", this.ship.length);
      });

    }).catch(e => {
        console.log("JOIN ERROR", e);
        return null;
    });

    // Make ship
    let ship = new PlayerShip({
      position: {
        x: this.state.screen.width/2,
        y: this.state.screen.height/2
      },
      rotation: 0,
      create: this.createObject.bind(this),
      onDie: this.gameOver.bind(this)
    });
    this.ship = [];
    this.createObject(ship, 'ship');
  }

  gameOver(){
    this.setState({
      inGame: false,
    });

    // clean up game objects, player is always index 0
    console.log("leaving game");
    this.room.send("hit",["ship", 0, this.ship[0].position.x, this.ship[0].position.y]);
    this.room.leave(true);
    this['ship'].delete = true;

    // Replace top score
    if(this.state.currentScore > this.state.topScore){
      this.setState({
        topScore: this.state.currentScore,
      });
      localStorage['topscore'] = this.state.currentScore;
    }
  }

  // pretty big assumption here that the client and server keep their asteroid arrays in sync
  // on both sides we splice(index,1) to remove destroyed elements, and push() new ones
  generateAsteroids(rocks){
//    let ship = this.ship[0];
//    console.log("generate",rocks.length);
//    let asteroids = this['asteroids'];
    this.asteroids = [];
//    this['asteroids'].splice(0, this['asteroids'].length);
    
    for (let i = 0; i < rocks.length; i++) {
      let server = rocks[i];
      let asteroid = new Asteroid({
        stats: server,
        create: this.createObject.bind(this),
        addScore: this.addScore.bind(this)
      });
      this.createObject(asteroid, 'asteroids');
    }
  }

  generateShips (ships) {
    // wipe all ships except [0] before generating from server
    this.ship.splice(1, this.ship.length-1);
    for (let i = 0; i < ships.length; i++) {
      let ship = new Ship({
        position: {
          x: ships[i].pos.x,
          y: ships[i].pos.y
        },
        rotation: ships[i].rtn,
        create: this.createObject.bind(this),
      });
      this.createObject(ship, 'ship');
    }
  }

  createObject(item, group){
    this[group].push(item);
  }

  // needs to be phased out in favour of handling onMessage("destroy", [...])
  // since all clients need to delete the same objects at the same time
  updateObjects(items, group){
    let index = items.length;
    for (let item of items) {
      index--;
      if (item.delete) {
        this[group].splice(index, 1);
      }else{
        items[index].render(this.state);
      }
    }
  }

  checkCollisions(items1, items2) {
    var a = items1.length - 1;
    var b;
    for(a; a > -1; --a){
      b = items2.length - 1;
      for(b; b > -1; --b){        
        var item1 = items1[a];
        var item2 = items2[b];
        if(this.checkCollision(item1, item2)){
          // oops, I need to send where the asteroid died since the server won't know
          // don't have to do this now, leave in place until verified
          let serverX = sendCoordinates(item2.position.x, window.innerWidth);
          let serverY = sendCoordinates(item2.position.y, window.innerHeight);
          this.room.send("hit", ["rock", b, serverX, serverY]);
          item1.destroy();
          item2.destroy();
        }
      }
    }
  }

  checkCollisionsWithShip(items1, items2) {
    for(let a = 0; a < items1.length; a++){
      for(let b = 0; b < items2.length; b++){
        var item1 = items1[a];
        var item2 = items2[b];
        if(this.checkCollision(item1, item2)){
          item1.destroy();
          // only track collisions for player ship
          if (a === 0) {
            this.gameOver();
          }
        }
      }
    }
  }

  // obj2 is always a rock
  checkCollision(obj1, obj2){
    if (obj2.radius === INVALID) return false;

    const vx = obj1.position.x - obj2.position.x;
    const vy = obj1.position.y - obj2.position.y;
    const lengthSquared = vx * vx + vy * vy;
    const collisionRadius = obj1.radius * obj1.radius + obj2.radius * obj2.radius;

    // in case we have some bad math or status passing
    if (isNaN(collisionRadius)) {
      console.log("invalid hitbox", obj1, obj2);
      return false;
    }

    return (lengthSquared < collisionRadius);
  }

  render() {
    let endgame;
    let message;

    if (this.state.currentScore <= 0) {
      message = '0 points... So sad.';
    } else if (this.state.currentScore >= this.state.topScore){
      message = 'Top score with ' + this.state.currentScore + ' points. Woo!';
    } else {
      message = this.state.currentScore + ' Points though :)'
    }

    if(!this.state.inGame){
      endgame = (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-16 z-1 text-center">
          <p>Game over, man!</p>
          <p>{message}</p>
          <button className="border-4 border-white bg-transparent text-white text-m px-10 py-5 m-5 cursor-pointer hover:bg-white hover:text-black"
            onClick={ this.startGame.bind(this) }>
            try again?
          </button>
        </div>
      )
    }

    return (
      <div>
        { endgame }
        <span className="block absolute top-15 z-1 text-sm left-20" >Score: {this.state.currentScore}</span>
        <span className="block absolute top-15 z-1 text-sm right-20" >Top Score: {this.state.topScore}</span>
        <span className="block absolute top-15 left-1/2 -translate-x-1/2 translate-y-0 z-1 text-sm text-center leading-normal" >
          Use [A][S][W][D] or [←][↑][↓][→] to MOVE<br/>
          Use [SPACE] to SHOOT
        </span>
        <canvas ref="canvas"
          width={this.state.screen.width * this.state.screen.ratio}
          height={this.state.screen.height * this.state.screen.ratio}
        />
      </div>
    );
  }
}
