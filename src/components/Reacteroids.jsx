import React, { Component } from 'react';
import { Ship, PlayerShip } from './Ship';
import Asteroid from './Asteroid';
import { Bullet } from './Bullet';
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

/********************************************************************
 * Reacteroids - main game logic
 */
export class Reacteroids extends Component {

  /******************************************************************
   * Constructor
   * sets state based on game window and hardcoded starting values
   */
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
    this.xbullets = [];
    this.particles = [];
  }

  /*****************************************************************
   * handleResize
   * adjusts screen when resizing, some jank when working on my laptop
   */
  handleResize(value, e){
    this.setState({
      screen : {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
      }
    });
  }

  /********************************************************************
   * handleKeys
   * tracks value 'true' for keyDown and 'false' for keyUp
   * repeats keystroke as long as value is 'true'
   */
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

  /***************************************************************************
   * componentDidMount
   * early program lifecycle, sets up listeners and callbacks
   */
  componentDidMount() {
    window.addEventListener('keyup',   this.handleKeys.bind(this, false));
    window.addEventListener('keydown', this.handleKeys.bind(this, true));
    window.addEventListener('resize',  this.handleResize.bind(this, false));

    const context = this.refs.canvas.getContext('2d');
    this.setState({ context: context });

    requestAnimationFrame(() => {this.update()});
  }

  /**************************************************************
   * componentWillUnmount
   * handle app cleanpu
   */
  componentWillUnmount() {
    window.removeEventListener('keyup', this.handleKeys);
    window.removeEventListener('keydown', this.handleKeys);
    window.removeEventListener('resize', this.handleResize);
  }

  /****************************************************************
   * update
   * Main game loop: 
   *  determine if we're still playing
   *  update game objects' position and live/dead status
   *  send status messages to server (ship and bullet poitions)
   */
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
    this.updateObjects(this.particles, 'particles');
    this.updateObjects(this.asteroids, 'asteroids');
    this.updateObjects(this.bullets, 'bullets');
    this.updateObjects(this.xbullets, 'xbullets');
    this.updateObjects(this.ship, 'ship');

    var bulletPositions = [];
    for (let b of this.bullets) {
      bulletPositions.push({x: b.position.x, y: b.position.y});
    }

    if (this.room) {
      if (ship) { this.room.send("ship", [ship.position.x, ship.position.y, ship.rotation]); }
      if (bulletPositions.length > 0) { this.room.send("shot", bulletPositions); }
    }

    context.restore();

    requestAnimationFrame(() => {this.update()});
  }

  /*********************************************************
   * addScore
   * does what it says, least problematic function
   */
  addScore(points){
    if(this.state.inGame){
      this.setState({
        currentScore: this.state.currentScore + points,
      });
    }
  }

  /********************************************************************************
   * startGame
   * set playing state, multiplayer room connection, set up onStateChange callback
   *  onStateChange callback sends locations of all asteroids, ships and bullets
   *  separate update and render for each of those though
   */
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
        this.generateBullets(newState.bullets);
//        console.log("ships to draw:", this.ship.length);
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
    this.ship[0].delete = true; // delete player ship

    // Replace top score
    if(this.state.currentScore > this.state.topScore){
      this.setState({
        topScore: this.state.currentScore,
      });
      localStorage['topscore'] = this.state.currentScore;
    }
  }

  /**********************************************************************
   * generateAsteroids
   * creates new targets from server state data
   * link callbacks for setting up particles and increasing score
   */
  generateAsteroids(rocks){
//    console.log("generate",rocks.length);
    this.asteroids = [];
    
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

  /*****************************************************************
   * generateShips
   * wipes out ship catalog except for the player's ship
   * might be better to put player ship in a separate group like with bullets
   */
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

  /*****************************************************************
   * generateBullets
   * this is just for drawing bullets that exist on server side
   */
  generateBullets (server_bullets) {
    // wipe all bullets
    this.xbullets = [];
    for (let i = 0; i < server_bullets.length; i++) {
      //console.log("background bullet:", server_bullets[i]);
      this.xbullets.push (new Bullet(server_bullets[i]));
    }
  }

  // why is this a function?
  createObject(item, group){
    this[group].push(item);
  }

  /*********************************************************************************
   * updateObjects
   * render (causing status update) or remove game elements passed here
   */
  updateObjects(items, group) {
    // had a bug where items were iterating up and index was iterating down
    // for player bullets this would result in one delete skipping the rest's renders
    // console.log("update", group, items.length);
    for (let index = items.length; index > 0;) {
    //  console.log(items[index], index);
      index--;
      if (items[index].delete) {
        this[group].splice(index, 1);
      }else{
        items[index].render(this.state);
      }
    }
  }

  /********************************************************************************
   * checkCollisions
   * generalized collision algorithm, but only really used for <PlayerBullet, Asteroid>
   */
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

  /*****************************************************************************
   * checkCollisionsWithShip
   * specialized logic for <Ship, Asteroid> collisions
   */
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

  /***********************************************************************************
   * checkCollision
   * obj2 is always a rock 
   * removed sqrt call by comparing squareds distance values
   */ 
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
  
  /**************************************************************************
   * actually draw HTML and stuff
   */
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
