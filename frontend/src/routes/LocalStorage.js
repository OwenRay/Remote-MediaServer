/**
 * Created by owenray on 6/30/2017.
 */

import React, { PureComponent } from 'react';
import { Flipped } from 'react-flip-toolkit';
import { Card, Row, Col, Button, TextInput } from 'react-materialize';
import Slider from 'rc-slider';
import LocalStorage from '../helpers/LocalStorage';
import { throttle } from 'throttle-debounce';
import MediaItemTile from '../components/mediaItem/MediaItemTile';

class LocalStorageRoute extends PureComponent {
  constructor() {
    super();
    this.state = {
      desiredQuota: 0,
      quota: {},
    };

    this.onChangeSlider = this.onChangeSlider.bind(this);
    this.onChangeInput = this.onChangeInput.bind(this);
    this.refreshQuota = this.refreshQuota.bind(this);
    this.save = this.save.bind(this);
  }

  componentWillMount() {
    this.refreshQuota();
    LocalStorage.addListener(-1, throttle(2000, this.refreshQuota));
  }

  async refreshQuota() {
    const quota = await LocalStorage.getCurrentQuota();
    this.setState({ quota });
    if (this.state.desiredQuota === 0) {
      this.setState({ desiredQuota: quota.granted });
    }
  }

  onChangeSlider(desiredQuota) {
    this.setState({ desiredQuota });
  }

  onChangeInput(e) {
    this.setState({ desiredQuota: parseInt(e.target.value, 10) });
  }

  async save() {
    await LocalStorage.requestStorage(this.state.desiredQuota);
    this.refreshQuota();
  }

  render() {
    return (
      <Flipped flipId="page">
        <div>
          <Card
            className="localStorage"
            actions={[<Button onClick={this.save}>Save</Button>]}
          >
            <h3>Offline Storage Quota</h3>
            <div>
              <Row>
                <TextInput
                  s={3}
                  label={`${this.state.quota.used}G / ${this.state.quota.granted}G`}
                  value={`${this.state.desiredQuota}`}
                  onChange={this.onChangeInput}
                />
                <Col s={9}>
                  <Slider
                    onChange={this.onChangeSlider}
                    step={1}
                    value={this.state.desiredQuota}
                    min={1}
                    max={100}
                  />
                </Col>
              </Row>
            </div>
          </Card>
          <Card className="localStorage">
            <h3>Available Offline</h3>
            <div className="verticalList">
              {LocalStorage.getItems().length ?
                LocalStorage.getItems().map(i => <MediaItemTile key={i.id} mediaItem={i} />) :
                'No offline items yet'
              }
            </div>
          </Card>
        </div>
      </Flipped>
    );
  }
}

export default LocalStorageRoute;
