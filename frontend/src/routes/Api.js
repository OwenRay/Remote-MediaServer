/* global $ */
/**
 * Created by owenray on 6/30/2017.
 */

import React, { PureComponent } from 'react';
import { Flipped } from 'react-flip-toolkit';
import { Card, Chip } from 'react-materialize';
import MarkdownIt from 'markdown-it';

class Api extends PureComponent {
  constructor(props) {
    super(props);
    this.state = { data: [] };
  }

  async componentWillMount() {
    const data = await $.get('/api/documentation');
    this.setState({ data: data.apiDoc });
  }

  toggle(index) {
    const data = this.state.data.slice(0);
    data[index].open = !data[index].open;
    this.setState({ data });
  }

  render() {
    const md = new MarkdownIt();

    return (
      <Flipped flipId="page" >
        <div>
          <Card>
            <h3>API Documentation</h3>
            Click any for details
          </Card>
          {this.state.data.map((o, index) => (
            <Card
              className={`api ${o.open ? 'open' : ''}`}
              key={index}
            >
              <header onClick={() => { this.toggle(index); }}>
                <Chip>{o.method.toUpperCase()}</Chip>
                <b>{o.url}</b>
                <span>{o.classname}</span>
              </header>
              <p dangerouslySetInnerHTML={{ __html: md.render(o.description) }} />
            </Card>
          ))}
        </div>
      </Flipped>
    );
  }
}

export default Api;
