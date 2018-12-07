import React from 'react';
import { Table } from 'react-materialize';
import ReadableDuration from '../ReadableDuration';
import FileSize from '../FileSize';

function mediaInfo(props) {
  const i = props.item;
  if (!i) return null;
  return (
    <Table>
      <tbody>
        <tr>
          <th>File:</th><td>{i.filepath}</td>
        </tr>
        <tr>
          <th>Media type:</th><td>{i.mediaType}</td>
        </tr>
        <tr>
          <th>Media dimensions:</th><td>{i.width}x{i.height}</td>
        </tr>
        <tr>
          <th>Duration:</th><td><ReadableDuration>{i.fileduration}</ReadableDuration></td>
        </tr>
        <tr>
          <th>Bitrate:</th><td><FileSize>{i.bitrate}</FileSize>ps</td>
        </tr>
        <tr>
          <th>Filesize:</th><td><FileSize>{i.filesize}</FileSize></td>
        </tr>
        <tr>
          <th>Date added:</th><td>{new Date(i.dateAdded).toDateString()}</td>
        </tr>
        <tr>
          <th>Release date</th><td>{i.releaseDate}</td>
        </tr>
        <tr>
          <th>Episode title:</th><td>{i.episodeTitle}</td>
        </tr>
        <tr>
          <th>Season</th><td>{i.season}</td>
        </tr>
        <tr>
          <th>Episode</th><td>{i.episode}</td>
        </tr>
      </tbody>
    </Table>
  );
}

export default mediaInfo;
