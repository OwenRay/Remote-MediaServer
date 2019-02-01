/**
 * Created by owenray on 6/30/2017.
 */
/* global $ */

import React, { PureComponent } from 'react';
import { Card, ProgressBar } from 'react-materialize';
import { Flipped } from 'react-flip-toolkit';
import { deserialize } from 'redux-jsonapi';
import MediaItemTile from '../components/mediaItem/MediaItemTile';
import store from '../helpers/stores/apiStore';

class Home extends PureComponent {
  static deserializeAll(items) {
    items.included.forEach(i => deserialize(i, store));
    return items.data.map(i => deserialize(i, store));
  }

  async componentWillMount() {
    const data = await $.get('/api/watchNext');
    this.setState({
      items: [
        Home.deserializeAll(data.continueWatching),
        Home.deserializeAll(data.recommended),
        Home.deserializeAll(data.newMovies),
        Home.deserializeAll(data.newTV),
      ],
    });
  }

  renderList() {
    if (!this.state) {
      return <Card><ProgressBar /></Card>;
    }

    const titles = ['Continue watching', 'Recommended Movies', 'New Movies', 'New Episodes'];

    return this.state.items.map((items, index) => (
      <Card title={titles[index]}>
        <div className="verticalList">
          {items.length ?
                items.map(i => <MediaItemTile key={i.id} mediaItem={i} />) :
                'Nothing to see here yet'
              }
        </div>
      </Card>
    ));
  }

  render() {
    return (
      <Flipped flipId="page">
        <div>
          {this.renderList()}
          <div className="homeLogo">
            <img alt="Remote" src="/assets/img/logo.png" height={200} />
          </div>
        </div>
      </Flipped>
    );
  }
}

export default Home;
