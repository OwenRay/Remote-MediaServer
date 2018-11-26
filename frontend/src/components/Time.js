import React from 'react';

function Time(props) {
  let seconds = `${Math.floor(props.children % 60)}`;
  let minutes = `${Math.floor((props.children % 3600) / 60)}`;
  const hours = Math.floor(props.children / 60 / 60);
  if (seconds.length < 2) {
    seconds = `0${seconds}`;
  }
  if (minutes.length < 2) {
    minutes = `0${minutes}`;
  }
  return (<span style={props.style} className="time">{hours}:{minutes}:{seconds}</span>);
}

export default Time;
