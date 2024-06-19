import React, { Component } from "react";
import { Ship, PlayerShip, GHOST } from "./Ship";
import Asteroid from "./Asteroid";
import { Bullet } from './Bullet';
import { sendCoordinates, getSessionColour } from "../utils/functions";
import { Client } from "colyseus.js";
import { GameState } from "../../multiplayer/src/rooms/schema/MyRoomState";

// are asteroids a hazard?
const SAFE = 1;
const DANGER = 0;

const COLYSEUS_HOST = "ws://localhost:2567";
const GAME_ROOM = "my_room";
const client = new Client(COLYSEUS_HOST);

// weed out minimal controller inputs
const AXIS_DEAD_ZONE = 0.1;

// gamepad axis parameters for flightstick
const FLIGHT_AXIS = {
  AXIS_ROLL: 0,
  AXIS_PITCH: 1,
  AXIS_YAW: 5,
  AXIS_HAT: 9
  // HAT emits a constant value for neutral, up, down, left, right
}

const KEY = {
  LEFT: 37,
  RIGHT: 39,
  UP: 38,
  A: 65,
  D: 68,
  W: 87,
  SPACE: 32,
};

export class Reacteroids extends Component {
  constructor() {
    super();

    this.state = {
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
      },
      context: null,
      keys: {
        left: 0,
        right: 0,
        up: 0,
        down: 0,
        space: 0,
      },
      currentScore: 0,
      topScore: localStorage["topscore"] || 0,
      inGame: false,
    };
    this.ship = [];
    this.xships = [];
    this.asteroids = [];
    this.bullets = [];
    this.xbullets = [];
    this.particles = [];

    // track level changes and give a couple seconds' invincibility
    this.level = 0;
    this.mode = DANGER;
  }

  handleResize(value, e) {
    this.setState({
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
      },
    });
  }

  handleKeys(value, e) {
    let keys = this.state.keys;
    if (e.keyCode === KEY.LEFT || e.keyCode === KEY.A) keys.left = value;
    if (e.keyCode === KEY.RIGHT || e.keyCode === KEY.D) keys.right = value;
    if (e.keyCode === KEY.UP || e.keyCode === KEY.W) keys.up = value;
    if (e.keyCode === KEY.SPACE) keys.space = value;
    this.setState({
      keys: keys,
    });
  }

  componentDidMount() {
    window.process = { ...window.process };
    window.addEventListener("keyup", this.handleKeys.bind(this, false));
    window.addEventListener("keydown", this.handleKeys.bind(this, true));
    window.addEventListener("resize", this.handleResize.bind(this, false));

    // 1. check if gamepad has enough input axes to control the ship
    // 2. remember the controller index number
    // 3. compare controller ID value so we know which axes to map to which functions
    // 4. set input functions on Ship to call navigator.getGamepads and get axis values
    window.addEventListener("gamepadconnected", (e) => {
      this.controllerInput = navigator.getGamepads();
      console.log(
        "Gamepad connected at index %d: %s. %d buttons, %d axes.",
        e.gamepad.index,
        e.gamepad.id,
        e.gamepad.buttons.length,
        e.gamepad.axes.length,
      );
    });

    const context = this.refs.canvas.getContext("2d");
    this.setState({ context: context });

    requestAnimationFrame(() => this.update());
  }

  componentWillUnmount() {
    window.removeEventListener("keyup", this.handleKeys);
    window.removeEventListener("keydown", this.handleKeys);
    window.removeEventListener("resize", this.handleResize);
  }

  async update() {
    const context = this.state.context;
    const keys = this.state.keys;
    const ship = this.ship[0];

    let gamepads = navigator.getGamepads();
    console.log(gamepads);
    if (gamepads) {
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i] && gamepads[i].axes) {
          for (let j = 0; j < gamepads[i].axes.length; j++) {
            let diff = gamepads[i].axes[j];
            if (Math.abs(diff) > AXIS_DEAD_ZONE) {
              console.log ("gamepad", i, "axis", j, diff);
            }
          }
        }
      }
      this.controllerInput = gamepads;
    }

    context.save();
    context.scale(this.state.screen.ratio, this.state.screen.ratio);

    // Motion trail
    context.fillStyle = "#000";
    context.globalAlpha = 0.1;
    context.fillRect(0, 0, this.state.screen.width, this.state.screen.height);
    context.globalAlpha = 1;

    // Check for colisions
    if (this.mode === DANGER) {
      this.checkCollisionsWith(this.bullets, this.asteroids);
      this.checkCollisionsWithShip(this.ship, this.asteroids);
    }
    this.checkCollisionsWithShip(this.ship, this.xbullets);

    // Remove or render
    // draw NPC images before player images, so they don't obscure
    // draw particles last so they don't get covered over
    this.updateObjects(this.asteroids, "asteroids");
    this.updateObjects(this.xbullets, "xbullets");
    this.updateObjects(this.xships, "xships");
    this.updateObjects(this.bullets, "bullets");
    this.updateObjects(this.ship, "ship");
    this.updateObjects(this.particles, "particles");

    var bulletPositions = [];
    for (let b of this.bullets) {
      const serverX = sendCoordinates(b.position.x, window.innerWidth);
      const serverY = sendCoordinates(b.position.y, window.innerHeight);
      bulletPositions.push({x: serverX, y: serverY});
    }

    if (this.room && ship) {
      const serverX = sendCoordinates(ship.position.x, window.innerWidth);
      const serverY = sendCoordinates(ship.position.y, window.innerHeight);
      this.room.send("ship", [serverX, serverY, ship.rotation]);
      if (bulletPositions.length > 0) { this.room.send("bullet", bulletPositions); }
    }
    context.restore();

    // Next frame
    requestAnimationFrame(() => {
      this.update();
    });
  }

  addScore(points) {
    if (this.state.inGame) {
      this.setState({
        currentScore: this.state.currentScore + points,
      });
    }
  }

  startGame() {
    this.setState({
      inGame: true,
      currentScore: 0,
    });

    client
      .joinOrCreate(GAME_ROOM, {}, GameState)
      .then((room) => {
        this.room = room;
        this.room.onStateChange((newState) => {
          this.game_state = newState;

          // detect server going up a difficulty level and impose a safe period
          if (newState.level > this.level) {
            console.log("Level", newState.level);
            this.level = newState.level;
            // turn off asteroid collisions
            this.mode = SAFE;
            // you have three seconds to comply
            window.setTimeout(() => {this.mode = DANGER;}, 3000);
          }

          this.generateShips(newState.players);
          this.generateAsteroids(newState.asteroids);
          this.generateBullets(newState.players);
        });
      })
      .catch((e) => {
        console.log("Join Error: ", e);
        return null;
      });

    // Make ship
    // we don't have this.room available while we do this!
    // could delay setting ship trail colour
    let ship = new PlayerShip({
      position: {
        x: 512,
        y: 512,
      },
      rotation: 0,
      create: this.createObject.bind(this),
      onDie: this.gameOver.bind(this),
      colour: "#FF0FFF"
    });
    this.ship.splice(0, this.ship.length);
    this.createObject(ship, "ship");
  }

  gameOver() {
    this.setState({
      inGame: false,
    });

    if (this.ship.length) {
      const serverX = sendCoordinates(this.ship[0].position.x, window.innerWidth);
      const serverY = sendCoordinates(this.ship[0].position.y, window.innerHeight);
      this.room.send("collision", ["ship", 0, serverX, serverY]);
      this.ship[0].delete = true;
    }
    this.room.leave(true);

    // Replace top score
    if (this.state.currentScore > this.state.topScore) {
      this.setState({
        topScore: this.state.currentScore,
      });
      localStorage["topscore"] = this.state.currentScore;
    }
  }

  generateShips(players) {
    // wipe all ghosts
    this.xships.splice(0, this.xships.length);
    for (let i = 0; i < players.length; i++) {
  
      if (players[i].id != this.room.sessionId) {
        let shipColour = getSessionColour(players[i].id);
        let ship = new Ship({
          position: {
            x: players[i].ship.position.x,
            y: players[i].ship.position.y,
          },
          rotation: players[i].ship.rotation,
          create: this.createObject.bind(this), // for creating particles
          colour: shipColour
        });
        this.createObject(ship, "xships");
      }
    }
  }

  generateAsteroids(asteroids) {
    this.asteroids.splice(0, this.asteroids.length);
    for (let i = 0; i < asteroids.length; i++) {
      let asteroid = new Asteroid({
        stats: asteroids[i],
        create: this.createObject.bind(this),
        addScore: this.addScore.bind(this),
        colour: (this.mode === SAFE)? "#7F7F7F": "#FFFFFF"
      });
      this.createObject(asteroid, "asteroids");
    }
  }

  generateBullets (players) {
    this.xbullets.splice(0, this.xbullets.length);
    for (let i = 0; i < players.length; i++) {
      if (players[i].id != this.room.sessionId) {
        let bulletColour = getSessionColour(players[i].id);
        for (let j = 0; j < players[i].bullets.length; j++) {
          let args = players[i].bullets[j];
          args.colour = bulletColour; // insert colour
          this.createObject (new Bullet(players[i].bullets[j]), 'xbullets');
        }
      }
    }
  }

  createObject(item, group) {
    this[group].push(item);
  }

  updateObjects(items, group) {
    for (let index = items.length; index > 0; ) {
      index--;
      if (items[index].delete) {
        this[group].splice(index, 1);
      } else {
        items[index].render(this.state);
      }
    }
  }

  checkCollisionsWith(items1, items2) {
    var a = items1.length - 1;
    var b;
    for (a; a > -1; --a) {
      b = items2.length - 1;
      for (b; b > -1; --b) {
        var item1 = items1[a];
        var item2 = items2[b];
        if (this.checkCollision(item1, item2)) {
          let serverX = sendCoordinates(item2.position.x, window.innerWidth);
          let serverY = sendCoordinates(item2.position.y, window.innerWidth);
          this.room.send("collision", ["asteroid", b, serverX, serverY]);
          item1.destroy();
          item2.destroy();
        }
      }
    }
  }

  checkCollisionsWithShip(items1, items2) {
    var a = items1.length - 1;
    var b;
    for (a; a > -1; --a) {
      // skip collision if ship is a ghost
      if (items1[a].mode === GHOST) {
      } else {
        b = items2.length - 1;
        for (b; b > -1; --b) {
          var item1 = items1[a];
          var item2 = items2[b];
          if (this.checkCollision(item1, item2)) {
            item1.destroy();
            if (a === 0) {
              this.gameOver();
            }
          }
        }
      }
    }
  }

  checkCollision(obj1, obj2) {
    var vx = obj1.position.x - obj2.position.x;
    var vy = obj1.position.y - obj2.position.y;
    var length = Math.sqrt(vx * vx + vy * vy);
    if (length < obj1.radius + obj2.radius) {
      return true;
    }
    return false;
  }

  render() {
    let endgame;
    let message;

    if (this.state.currentScore <= 0) {
      message = "0 points... So sad.";
    } else if (this.state.currentScore >= this.state.topScore) {
      message = "Top score with " + this.state.currentScore + " points. Woo!";
    } else {
      message = this.state.currentScore + " Points though :)";
    }

    if (!this.state.inGame) {
      endgame = (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-16 z-1 text-center">
          <p>Game over, man!</p>
          <p>{message}</p>
          <button className="border-4 border-white bg-transparent text-white text-m px-10 py-5 m-5 cursor-pointer hover:bg-white hover:text-black" onClick={this.startGame.bind(this)}>
            try again?
          </button>
        </div>
      );
    }

    return (
      <div>
        {endgame}
        <span className="block absolute top-15 z-1 text-sm left-20">Score: {this.state.currentScore}</span>
        <span className="block absolute top-15 z-1 text-sm right-20">Top Score: {this.state.topScore}</span>
        <span className="block absolute top-15 left-1/2 -translate-x-1/2 translate-y-0 z-1 text-sm text-center leading-normal">
          Use [A][S][W][D] or [←][↑][↓][→] to MOVE
          <br />
          Use [SPACE] to SHOOT
        </span>
        <canvas ref="canvas" width={this.state.screen.width * this.state.screen.ratio} height={this.state.screen.height * this.state.screen.ratio} />
      </div>
    );
  }
}
