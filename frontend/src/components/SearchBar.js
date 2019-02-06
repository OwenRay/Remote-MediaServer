/* eslint-disable no-underscore-dangle */
/**
 * Created by owenray on 19/07/2017.
 */

import React, { Component } from 'react';
import { Button, Icon, Input, Row } from 'react-materialize';
import { deserialize } from 'redux-jsonapi';
import store from '../helpers/stores/settingsStore';

class SearchBar extends Component {
  constructor() {
    super();
    this.toggleGrouped = this.toggleGrouped.bind(this);
    this.state = { filters: { title: '' }, settings: { libraries: [] } };
  }

  componentWillMount() {
    this.onChange = this.onChange.bind(this);
    store.subscribe(this.onSettingsChange.bind(this));
    this.onSettingsChange();
  }

  /**
   * triggered when the settings model changes
   */
  onSettingsChange() {
    const { api } = store.getState();
    if (!api.setting) {
      return;
    }
    this.setState({
      settings: deserialize(api.setting[1], store),
    });
  }

  /**
   * @param e
   * called when user types in field, applies typed value to state
   */
  onChange(e) {
    e.stopPropagation();
    e.preventDefault();
    const o = this.state;
    o.filters[e.target.name] = e.target.value;
    this.setState(o);

    if (this.props.onChange) {
      this.props.onChange(o.filters);
    }
  }

  toggleGrouped() {
    const f = this.state.filters;
    f.distinct = f.distinct ? '' : 'external-id';
    if (this.props.onChange) {
      this.props.onChange(f);
    }
  }

  render() {
    if (this.state === null) { return null; }
    const { props } = this;
    const { filters } = props;
    return (
      <div className={props.className}>
        <Row>
          <Input s={3} name="libraryId" type="select" label="Library:" value={filters.libraryId} onChange={this.onChange}>
            <option value="">All libraries</option>
            {this.state.settings.libraries.map((lib) => {
              let { uuid } = lib;
              if (lib.type === 'shared') [uuid] = uuid.split('-');

              return <option key={uuid} value={uuid}>{lib.name}</option>;
            })}
          </Input>
          <div className="col search s6">
            <Input s={12} name="title" type="text" label="" value={filters.title} onChange={this.onChange} />
            <Button className="mdi-action-search"><Icon>search</Icon></Button>
          </div>
          <Input s={3} name="sort" type="select" label="Sort by:" value={filters.sort} onChange={this.onChange}>
            <option value="title">Title</option>
            <option value="date_added:DESC">Date added</option>
            <option value="release-date:DESC">Date released</option>
          </Input>
          <Button
            className="toggleGroup"
            data-tip={filters.distinct ? 'Disable grouping' : 'Enable grouping'}
            floating
            onClick={this.toggleGrouped}
            icon={filters.distinct ? 'layers_clear' : 'layers'}
          />
        </Row>
      </div>
    );
  }
}

export default SearchBar;
