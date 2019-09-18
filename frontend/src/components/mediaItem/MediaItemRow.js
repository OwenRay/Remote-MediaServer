/**
 * Created by owenray on 19/07/2017.
 */

import React from 'react';
import { Icon } from 'react-materialize';
import { NavLink } from 'react-router-dom';
import { MediaItemTile } from './MediaItemTile';
import FileSize from '../FileSize';

class MediaItemRow extends MediaItemTile {
  title() {
    const { state } = this;
    if (state.episode) return `${state.episode} - ${state.episodeTitle}`;
    return (
      <span>
        <FileSize>{state.filesize}</FileSize> {state.height}p
      </span>
    );
  }

  render() {
    if (!this.state) {
      return (
        <div className="collection-item">
          <Icon>movie</Icon>
        </div>
      );
    }

    return (
      <NavLink to={`/item/detail/${this.state.id}`} className="collection-item">
        {this.title()}
        {this.playPos()}
      </NavLink>
    );
  }
}

export default MediaItemRow;
