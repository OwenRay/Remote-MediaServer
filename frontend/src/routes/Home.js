/**
 * Created by owenray on 6/30/2017.
 */
import React, { Component } from 'react';
import { Card } from 'react-materialize';
import { Flipped } from 'react-flip-toolkit';

class home extends Component {
  constructor() {
    super();
    this.state = {};
  }

  render() {
    if (!this.state) return null;
    return (
      <Flipped flipId="page">
        <div>
          <Card>
            This will be the landingpage,<br />
            enabling you to continue watching where you left of...<br />
            some time in the future...
          </Card>
          <div className="homeLogo">
            <img alt="Remote" src="/assets/img/logo.png" height={200} />
          </div>
        </div>
      </Flipped>
    );
  }
}

export default home;
