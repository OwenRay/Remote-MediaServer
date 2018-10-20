/**
 * Created by owenray on 6/30/2017.
 */
import React from 'react';
import { Card } from 'react-materialize';

function home() {
  return (
    <div>
      <Card>
        This will be the landingpage,
        enabling you to continue watching where you left of...
        some time in the future...
      </Card>
      <div className="homeLogo">
        <img alt="Remote" src="/assets/img/logo.png" height={200} />
      </div>
    </div>
  );
}

export default home;
