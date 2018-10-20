/**
 * Created by owenray on 19/07/2017.
 */

import React from 'react';
import { Icon } from 'react-materialize';
import { NavLink } from 'react-router-dom';
import MediaItemTile from './MediaItemTile';

class MediaItemRow extends MediaItemTile {
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
        {this.state.episode} - {this.state.episodeTitle}
        {this.playPos()}
      </NavLink>
    );
  }
}

export default MediaItemRow;
