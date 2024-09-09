import React, { Component } from 'react';

class StartMenu extends Component {
  render() {
    const { onStart } = this.props;

    return (
        <div>

            <h1>Reacteroids</h1>
            <button id="startButton" onClick={onStart}>Start Game 🚀🪨</button>
       
        </div>
      );
  }
}

export default StartMenu;