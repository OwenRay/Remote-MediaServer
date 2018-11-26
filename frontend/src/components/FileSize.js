import React from 'react';

const units = ['b', 'Kb', 'Mb', 'Gb', 'Tb', 'Pb'];

function FileSize(props) {
  let n = 0;
  let size = props.children;
  while (size > 999) {
    size /= 1000;
    n += 1;
  }
  if (size < 10) size = Math.round(size * 100) / 100;
  else if (size < 100) size = Math.round(size * 10) / 10;
  else size = Math.round(size);
  return <span>{size}{units[n]}</span>;
}

export default FileSize;
