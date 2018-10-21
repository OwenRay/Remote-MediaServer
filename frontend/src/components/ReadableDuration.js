import React from 'react';

function readableDuration(props) {
  return <span>{`${Math.round(props.children / 60)}m`}</span>;
}

export default readableDuration;
