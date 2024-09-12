import React, { Component } from 'react';
import marioAudio from '../assets/mario.mp3';
import soundOn from '../assets/sound-on-off/sound-on.png';
import soundOff from '../assets/sound-on-off/sound-off.png';
import '../App.css';

export class StartMenu extends Component {
  constructor(props) {
    super(props);
    this.marioAudio = new Audio(marioAudio);
    this.state = {
      audioPlayed: false
    };
  }

  componentDidMount() {
    this.marioAudio.play();
  }

  handleUserInteraction = () => {
    if (!this.state.audioPlayed) {
      // Play audio after user interaction
      this.marioAudio.play().catch(error => {
        console.error('Audio playback failed:', error);
      });
      this.setState({ audioPlayed: true });
      // Remove the event listener after first interaction
      document.removeEventListener('click', this.handleUserInteraction);
    }
    if (this.state.audioPlayed) {
      // Play audio after user interaction
      this.marioAudio.pause();
      this.setState({ audioPlayed: false });
      // Remove the event listener after first interaction
      document.removeEventListener('click', this.handleUserInteraction);
    }
  };




  render() {
    const { onStartGame } = this.props;

    return (
        <div className="startDiv">
        
          <div className="instructions">
                <h2>Instructions:</h2>
                <p>Use the arrow keys to move the ship and the space bar to shoot.</p>
                <p>Destroy the asteroids to earn points and avoid collisions to stay alive.</p>
            </div>
          <div className="middleContainer">
            <div className="bottomContent">  
                <h1>Reacteroids</h1>
                <button className="startButton" onClick={onStartGame}>Start Game 🚀🪨</button>
            
                <button className="soundButton" onClick={this.handleUserInteraction}>
                  <img src={this.state.audioPlayed ? soundOn : soundOff} alt="Icon"/>
                </button>
            </div>
          </div>
      </div>
      );
  }
}


