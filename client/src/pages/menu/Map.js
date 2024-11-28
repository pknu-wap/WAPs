import React from 'react';
import { Route, Routes, Link } from "react-router-dom";
import Room303 from "../../components/Map/Room303";
import Room306 from "../../components/Map/Room306";
import Room307 from "../../components/Map/Room307";
import Room308 from "../../components/Map/Room308";
import "../../assets/Map/Room.css";

const Map = () => {
  return (
    <div className="building-map">
      <h1>Map</h1>
      <div className="rooms">
        <div className='room'>
          <h1 className='roomNum'>303호</h1>
          <Room303/>
        </div>
        <div className='room'>
          <h1 className='roomNum'>306호</h1>
          <Room306/>
        </div>
        <div className='room'>
          <h1 className='roomNum'>307호</h1>
          <Room307/>
        </div>
        <div className='room'>
          <h1 className='roomNum'>308호</h1>
          <Room308/>
        </div>
      </div>
    </div>
  );
};

export default Map;
