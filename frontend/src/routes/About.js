/**
 * Created by owenray on 6/30/2017.
 */

import React from 'react';
import { Flipped } from 'react-flip-toolkit';
import { Card, Icon } from 'react-materialize';
import { Link } from 'react-router-dom';

function About() {
  return (
    <Flipped flipId="page">
      <div>
        <Card className="about">
          <h3>Remote MediaServer</h3>
          A full open source media server that can index your videos, match them against
          movies and tv shows and allow your to watch them straight from your browser.<br />

          <a rel="noopener noreferrer" target="_blank" href="https://github.com/OwenRay/Remote-MediaServer">
            <img src="/assets/img/github.png" alt="Github" />
            Github
          </a>
          <a rel="noopener noreferrer" target="_blank" href="https://discord.gg/4H5EMd6">
            <img src="/assets/img/discord.svg" alt="Discord" />
            Discord
          </a>
          <Link to="/Api">
            <Icon>code</Icon>
            API documentation
          </Link>
          <a rel="noopener noreferrer" target="_blank" href="https://github.com/OwenRay/Remote-MediaServer/issues">
            <Icon>report_problem</Icon>
            Report a problem
          </a>
        </Card>
      </div>
    </Flipped>
  );
}

export default About;
