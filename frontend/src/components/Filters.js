import React, { PureComponent } from 'react';
/* global $ */
import { Button, Col, Row, Icon, Select, Chip } from 'react-materialize';
import { Handle, Range } from 'rc-slider';
import 'rc-slider/assets/index.css';

let genres = [];

class ButtonMenu extends PureComponent {
  constructor() {
    super();
    this.options = {
      closeOnClick: false,
      edge: 'right',
      draggable: false,
    };
    this.autoCompleteOptions = {
      autocompleteOptions: {
        minLength: 1,
        limit: 5,
      },
      onChipAdd: this.onChipAdd.bind(this),
      onChipDelete: this.onChipDelete.bind(this),
    };
    if (!genres.length) { $.getJSON('/api/tmdb/genres', this.genresLoaded.bind(this)); }
    this.onChange = this.onChange.bind(this);
    this.onValueChange = this.onValueChange.bind(this);
    this.resetFilters = this.resetFilters.bind(this);
    this.state = { filters: {}, genres };
  }

  genresLoaded(o) {
    genres = o;
    this.setState({ genres });
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
    this.setState({ filters: f });
  }

  onChipAdd(chip, val) {
    const value = val.textContent.replace(/close$/, '');
    const o = this.state;
    const actors = o.filters.actors ? o.filters.actors.split(',') : [];
    actors.push(value);
    o.filters.actors = actors.join(',');
    this.setState(o);

    if (this.props.onChange) {
      this.props.onChange(o.filters);
    }
  }

  onChipDelete(chip, val) {
    const value = val.textContent.replace(/close$/, '');
    const o = this.state;
    const actors = o.filters.actors ? o.filters.actors.split(',') : [];
    actors.splice(actors.indexOf(value), 1);
    o.filters.actors = actors.join(',');
    this.setState(o);

    if (this.props.onChange) {
      this.props.onChange(o.filters);
    }
  }

  onValueChange(name, value) {
    console.log(arguments);
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
    this.props.onChange(null);
  }

  content() {
    const f = this.state.filters;
    const fv = this.props.filterValues;
    if (!f || !fv) {
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
    console.log('QQQ', f.actors);
    this.autoCompleteOptions.autocompleteOptions.data = actorsData;

    return (
      <div>
        <div className="top">
          <Row>
            <Select
              value={`${f['play-position.watched']}`}
              label="Watched"
              name="play-position.watched"
              onChange={this.onChange}
            >
              <option value="">Watched & unwatched</option>
              <option value="true">Watched only</option>
              <option value="false">Unwatched only</option>
            </Select>
          </Row>
          <Row>
            <Select
              value={f['genre-ids']}
              name="genre-ids"
              label="Genre"
              onChange={this.onChange}
            >
              <option value="">All</option>
              {this.state.genres.map(genre => <option key={genre.id} value={genre.id}>{genre.name}</option>)}
            </Select>
          </Row>
          <Row>
            <Select
              s={12}
              value={f.mpaa}
              name="mpaa"
              type="select"
              label="Age rating"
              onChange={this.onChange}
            >
              <option value="">All</option>
              {fv.mpaa.map(rating => <option key={rating} value={rating}>{rating}</option>)}
            </Select>
          </Row>
          <Row>
            <label>Actors</label>
            <Chip
              options={this.autoCompleteOptions}
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
          <Col s={12}>
            <Button onClick={this.resetFilters}>Reset</Button>
          </Col>
        </Row>
      </div>
    );
  }

  toggle = () => {
    this.setState({ open: !this.state.open });
  }

  render() {
    console.log('rerander');
    return (
      <div>
        <Button className="bottom-right-fab" onClick={this.toggle} floating>
          <Icon>tune</Icon>
        </Button>
        <div className={`filter${this.state.open ? 'Open' : 'Closed'}`}>
          <div className="filterBg" onClick={this.toggle}/>
          <div
            className="content card"
            // trigger={<Button className="bottom-right-fab" floating><Icon>tune</Icon></Button>}
            // options={this.options}
          >
            {this.content()}
          </div>
        </div>
      </div>
    );
  }
}

export default ButtonMenu;
