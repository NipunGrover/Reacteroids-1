import React, { Component } from "react";
import { Ship, PlayerShip } from "./Ship";
import Asteroid from "./Asteroid";
import {
  lerp,
  randomNumBetweenExcluding,
  sendCoordinates,
} from "../utils/functions";
import { Client, Room } from "colyseus.js";
import { GameState } from "../../multiplayer/src/rooms/schema/MyRoomState";

const COLYSEUS_HOST = "ws://localhost:2567";
const GAME_ROOM = "my_room";
const client = new Client(COLYSEUS_HOST);

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
      asteroidCount: 3,
      currentScore: 0,
      topScore: localStorage["topscore"] || 0,
      inGame: false,
    };
    this.ship = [];
    this.asteroids = [];
    this.bullets = [];
    this.particles = [];
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
    window.addEventListener("keyup", this.handleKeys.bind(this, false));
    window.addEventListener("keydown", this.handleKeys.bind(this, true));
    window.addEventListener("resize", this.handleResize.bind(this, false));

    const context = this.refs.canvas.getContext("2d");
    this.setState({ context: context });
    this.startGame();
    requestAnimationFrame(() => {
      this.update();
    });
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

    context.save();
    context.scale(this.state.screen.ratio, this.state.screen.ratio);

    // Motion trail
    context.fillStyle = "#000";
    //context.globalAlpha = 0.4;
    context.fillRect(0, 0, this.state.screen.width, this.state.screen.height);
    context.globalAlpha = 1;

    // Next set of asteroids

    // Check for colisions
    this.checkCollisionsWith(this.bullets, this.asteroids);
    this.checkCollisionsWithShip(this.ship, this.asteroids);

    // Remove or render
    this.updateObjects(this.particles, "particles");
    this.updateObjects(this.asteroids, "asteroids");
    this.updateObjects(this.bullets, "bullets");
    this.updateObjects(this.ship, "ship");

    if (this.room) {
      const serverX = sendCoordinates(ship.position.x, window.innerWidth);
      const serverY = sendCoordinates(ship.position.y, window.innerHeight);

      if (ship) {
        this.room.send("ship", [serverX, serverY, ship.rotation]);
      }
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
        //console.log(room.sessionId, "joined", room.name);
        this.room = room;

        this.room.onStateChange((newState) => {
          this.game_state = newState;
          this.generateShips(newState.ships);

          //this.generateShips(newState.ships);
        });
      })
      .catch((e) => {
        console.log("Join Error: ", e);
        return null;
      });
    // Make ship
    let ship = new PlayerShip({
      position: {
        x: 512,
        y: 512,
      },
      rotation: 0,
      create: this.createObject.bind(this),
      onDie: this.gameOver.bind(this),
    });
    //this.ship = [];
    this.createObject(ship, "ship");

    // Make asteroids
    this.asteroids = [];
    //this.generateAsteroids(this.state.asteroidCount);
  }

  gameOver() {
    this.setState({
      inGame: false,
    });

    this.room.send("collision", [
      "ship",
      a,
      item1.position.x,
      item1.position.y,
    ]);
    this["ship"].slice(0, 1);

    if (this.state.currentScore > this.state.topScore) {
      this.setState({
        topScore: this.state.currentScore,
      });
      localStorage["topscore"] = this.state.currentScore;
    }
  }
  generateShips(ships) {
    //Delete all but the first ship
    //console.log(ships.length, this.ship.length - 1);

    if (ships.length < this.ship.length) {
      this.ship.splice(1, this.ship.length - 1);
      for (let i = 1; i < ships.length; i++) {
        let ship = new Ship({
          position: {
            x: ships[i].position.x,
            y: ships[i].position.y,
            //  x: lerp(this.ship[i].position.x, ships[i].position.x, 0.25),
            //   y: lerp(this.ship[i].position.y, ships[i].position.y, 0.25),
          },
          rotation: ships[i].rotation,
          create: this.createObject.bind(this),
        });
        this.createObject(ship, "ship");
      }
    } else {
      console.log(this.ship);

      for (let i = 1; i < ships.length; i++) {
        this.ship[i].position.x = ships[i].position.x;
        //  this.ship[i].position.y = ships[i].position.y;
        // let ship = new Ship({
        //   position: {
        //     x: ships[i].position.x,
        //     y: ships[i].position.y,
        //     //  x: lerp(this.ship[i].position.x, ships[i].position.x, 0.25),
        //     //   y: lerp(this.ship[i].position.y, ships[i].position.y, 0.25),
        //   },
        //   rotation: ships[i].rotation,
        //   create: this.createObject.bind(this),
        // });
        // this.createObject(ship, "ship");
      }
    }
  }

  generateAsteroids(howMany) {
    let asteroids = [];
    let ship = this.ship[0];
    for (let i = 0; i < howMany; i++) {
      let asteroid = new Asteroid({
        size: 80,
        position: {
          x: randomNumBetweenExcluding(
            0,
            this.state.screen.width,
            ship.position.x - 60,
            ship.position.x + 60
          ),
          y: randomNumBetweenExcluding(
            0,
            this.state.screen.height,
            ship.position.y - 60,
            ship.position.y + 60
          ),
        },
        create: this.createObject.bind(this),
        addScore: this.addScore.bind(this),
      });
      this.createObject(asteroid, "asteroids");
    }
  }

  createObject(item, group) {
    this[group].push(item);
  }

  updateObjects(items, group) {
    for (let index = items.length; index > 0; ) {
      //  console.log(items[index], index);
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
      b = items2.length - 1;
      for (b; b > -1; --b) {
        var item1 = items1[a];
        var item2 = items2[b];
        if (this.checkCollision(item1, item2)) {
          item1.destroy();
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
          <button
            className="border-4 border-white bg-transparent text-white text-m px-10 py-5 m-5 cursor-pointer hover:bg-white hover:text-black"
            onClick={this.startGame.bind(this)}
          >
            try again?
          </button>
        </div>
      );
    }

    return (
      <div>
        {endgame}
        <span className="block absolute top-15 z-1 text-sm left-20">
          Score: {this.state.currentScore}
        </span>
        <span className="block absolute top-15 z-1 text-sm right-20">
          Top Score: {this.state.topScore}
        </span>
        <span className="block absolute top-15 left-1/2 -translate-x-1/2 translate-y-0 z-1 text-sm text-center leading-normal">
          Use [A][S][W][D] or [←][↑][↓][→] to MOVE
          <br />
          Use [SPACE] to SHOOT
        </span>
        <canvas
          ref="canvas"
          width={this.state.screen.width * this.state.screen.ratio}
          height={this.state.screen.height * this.state.screen.ratio}
        />
      </div>
    );
  }
}
