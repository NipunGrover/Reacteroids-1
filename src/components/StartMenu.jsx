import React, { Component } from 'react';

export class StartMenu extends Component {
  render() {
    const { onStartGame } = this.props;

    return (
        <div className="startDiv">

            <h1>Reacteroids</h1>
            <button className="startButton" onClick={onStartGame}>Start Game 🚀🪨</button>
       
        </div>
      );
  }
}


