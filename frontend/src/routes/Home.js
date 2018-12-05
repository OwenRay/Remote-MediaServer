/**
 * Created by owenray on 6/30/2017.
 */
import React, { Component } from 'react';
import { Card } from 'react-materialize';
import { Flipped, Flipper } from 'react-flip-toolkit';

class home extends Component {
  constructor() {
    super();
    this.state = {};
  }

  render() {
    if (!this.state) return null;
    return (
      <div>
        <h1> buiten animatie</h1>
        <Flipped flipId="page">
        <div>
          <Card style={{ 'margin-left': 100 }}>
            This will be the landingpage,<br />
            enabling you to continue watching where you left of...<br />
            some time in the future...
          </Card>
          <div className="homeLogo">
            <img alt="Remote" src="/assets/img/logo.png" height={200} />
          </div>
        </div>
        </Flipped>
      </div>
    );
  }
}

export default home;
