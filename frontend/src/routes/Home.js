/**
 * Created by owenray on 6/30/2017.
 */
/* global $ */

import React, { PureComponent } from 'react';
import { Card } from 'react-materialize';
import { Flipped } from 'react-flip-toolkit';
import MediaItemTile from '../components/mediaItem/MediaItemTile';
import { deserialize } from 'redux-jsonapi';
import store from '../helpers/stores/apiStore';

class Home extends PureComponent {
  static deserializeAll(items) {
    items.includes.forEach(i => deserialize(i, store));
    return items.data.map(i => deserialize(i, store));
  }

  async componentWillMount() {
    const data = await $.get('/api/watchNext');
    this.setState({ continueWatching: Home.deserializeAll(data.continueWatching) });
  }

  render() {
    return (
      <Flipped flipId="page">
        <div>
          <Card title="Continue watching">
            <div className="verticalList">
              {this.state && this.state.continueWatching.length ?
                this.state.continueWatching.map(i => <MediaItemTile mediaItem={i} />) :
                'Nothing to see here yet'
              }
            </div>
          </Card>
          <div className="homeLogo">
            <img alt="Remote" src="/assets/img/logo.png" height={200} />
          </div>
        </div>
      </Flipped>
    );
  }
}

export default Home;
