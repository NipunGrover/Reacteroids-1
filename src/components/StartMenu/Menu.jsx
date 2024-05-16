import React from 'react';
import Starfield from 'react-starfield';

export default function Menu({onClick}){
  
  return (
    <>
      <Starfield
        starCount={1000}
        starColor={[255, 255, 255]}
        speedFactor={0.05}
        backgroundColor="black"
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-16 z-1 text-center">
        <h1 className="text-5xl">Choose your side</h1>
        <br></br>
        <button onClick={onClick} className="border-4 box-border border-white bg-transparent text-white text-m px-10 py-5 m-5 cursor-pointer hover:shadow-2xl hover:shadow-lime-500 hover:border-lime-500 hover:bg-lime-500">REBEL</button>
        <button onClick={onClick} className="border-4 box-border border-white bg-transparent text-white text-m px-10 py-5 m-5 cursor-pointer hover:shadow-2xl hover:shadow-red-500 hover:border-red-500 hover:bg-red-500">SITH</button>
      </div>

    </>
  );
}
