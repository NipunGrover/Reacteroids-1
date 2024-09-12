import { useState } from 'react'
import './App.css'
import { Reacteroids } from './components/Reacteroids'
import {StartMenu} from './components/StartMenu'

function App() {

  const [isGameStarted, setIsGameStarted] = useState(false);

  const startGame = () => {
    setIsGameStarted(true);
  };

  return (
    <>
    {isGameStarted ? (
      <Reacteroids />
    ) : (
      <StartMenu onStartGame={startGame} />
    )}
  </>
  )
}

export default App
