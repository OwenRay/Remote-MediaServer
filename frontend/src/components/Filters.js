import React, { Component } from 'react';
/* global $ */
import { Button, Col, Input, Row, SideNav, Autocomplete } from 'react-materialize';
import { Handle, Range } from 'rc-slider';
import 'rc-slider/assets/index.css';

let genres;
$.getJSON('/api/tmdb/genres', (o) => { genres = o; });

class ButtonMenu extends Component {
  constructor() {
    super();
    this.onChange = this.onChange.bind(this);
    this.onValueChange = this.onValueChange.bind(this);
    this.hideSideNav = this.hideSideNav.bind(this);
    this.resetFilters = this.resetFilters.bind(this);
    this.state = { filters: {}, open: true };
  }

  componentWillReceiveProps(props) {
    const f = {};
    Object.keys(props.filters).forEach((key) => {
      if (['false', 'true'].includes(props.filters[key])) {
        f[key] = props.filters[key] === 'true';
      } else {
        f[key] = props.filters[key];
      }
    });
    this.setState({ filters: f, filterValues: props.filterValues });
  }

  onValueChange(name, value) {
    const o = this.state;
    if (name === 'fileduration') {
      value = value.map(v => v * 60);
    }
    o.filters[name] = Array.isArray(value) ? value.join('><') : value;
    this.setState(o);

    if (this.props.onChange) {
      this.props.onChange(o.filters);
    }
  }

  onChange(e) {
    const o = this.state;
    o.filters[e.target.name] = e.target.value;
    if (o.filters[e.target.name] === '') {
      delete o.filters[e.target.name];
    }
    this.setState(o);

    if (this.props.onChange) {
      this.props.onChange(o.filters);
    }
  }

  hideSideNav() {
    $(this.sideNav).sideNav('hide');
  }

  handle(props) {
    props.dragging += '';
    return (
      <Handle key={`handle${props.className}`} {...props} >
        {props.dragging !== 'false' ? <span>{props.value}</span> : ''}
      </Handle>
    );
  }

  resetFilters() {
    this.setState({ filters: {} });
    this.props.onChange({});
    this.hideSideNav();
  }

  content() {
    const f = this.state.filters;
    const fv = this.state.filterValues;
    if (!this.state.open || !f || !fv) {
      return null;
    }
    const rangeValue = f['vote-average'] ?
      f['vote-average'].split('><').map(v => parseFloat(v)) :
      [1, 10];
    const timeValue = f.fileduration ?
      f.fileduration.split('><').map(v => parseInt(v, 10) / 60) :
      [0, 300];
    const yearValue = f.year ?
      f.year.split('><').map(v => parseInt(v, 10)) :
      [1900, new Date().getFullYear()];

    const actorsData = {};
    fv.actors.forEach((actor) => { actorsData[actor] = null; });

    return (
      <div>
        <div className="top">
          <Row>
            <Input
              value={`${f['play-position.watched']}`}
              type="select"
              label="Watched"
              name="play-position.watched"
              onChange={this.onChange}
            >
              <option value="">Watched & unwatched</option>
              <option value="true">Watched only</option>
              <option value="false">Unwatched only</option>
            </Input>
          </Row>
          <Row>
            <Input
              value={f['genre-ids']}
              name="genre-ids"
              type="select"
              label="Genre"
              onChange={this.onChange}
            >
              <option value="">All</option>
              {genres.map(genre => <option key={genre.id} value={genre.id}>{genre.name}</option>)}
            </Input>
          </Row>
          <Row>
            <Input
              value={f.mpaa}
              name="mpaa"
              type="select"
              label="Age rating"
              onChange={this.onChange}
            >
              <option value="">All</option>
              {fv.mpaa.map(rating => <option key={rating} value={rating}>{rating}</option>)}
            </Input>
          </Row>
          <Row>
            <Autocomplete
              value={f.actors}
              name="actors"
              type="select"
              title="Actors"
              onAutocomplete={val => this.onValueChange('actors', val)}
              data={actorsData}
            />
          </Row>
          <Row>
            <label>Rating</label>
            <Range
              handle={this.handle}
              step={0.1}
              onChange={v => this.onValueChange('vote-average', v)}
              value={rangeValue}
              min={1}
              max={10}
            />
          </Row>
          <Row>
            <label>Runtime</label>
            <Range
              handle={this.handle}
              step={1}
              onChange={v => this.onValueChange('fileduration', v)}
              value={timeValue}
              min={0}
              max={300}
            />
          </Row>
          <Row>
            <label>Year</label>
            <Range
              handle={this.handle}
              step={1}
              onChange={v => this.onValueChange('year', v)}
              value={yearValue}
              min={1900}
              max={new Date().getFullYear()}
            />
          </Row>
        </div>
        <Row>
          <Col s={6}>
            <Button onClick={this.hideSideNav}>Close</Button>
          </Col>
          <Col s={6}>
            <Button onClick={this.resetFilters}>Reset</Button>
          </Col>
        </Row>
      </div>
    );
  }

  render() {
    return (
      <SideNav
        ref={(ref) => { this.sideNav = ref; }}
        trigger={<Button className="bottom-right-fab" floating icon="tune" />}
        options={{
          edge: 'right',
          draggable: true
        }}
      >
        {this.content()}
      </SideNav>
    );
  }
}

export default ButtonMenu;
