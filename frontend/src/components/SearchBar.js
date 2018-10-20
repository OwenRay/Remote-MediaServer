/* eslint-disable no-underscore-dangle */
/**
 * Created by owenray on 19/07/2017.
 */

import React, { Component } from 'react';
import { Button, Icon, Input, Row } from 'react-materialize';
import { deserialize } from 'redux-jsonapi';
import store from '../helpers/stores/settingsStore';

class SearchBar extends Component {
  componentWillMount() {
    this.lastScrollUpPos = 0;
    this.setState({ hidden: false, filters: { title: '' }, settings: { libraries: [] } });
    this.onChange = this.onChange.bind(this);
    store.subscribe(this.onSettingsChange.bind(this));
    this.onSettingsChange();
  }

  componentWillReceiveProps(props) {
    if (props.scroller && !this.scroller !== props.scoller) {
      this.scroller = props.scroller;
      const onScroll = props.scroller._collectionView._onScroll;
      props.scroller._collectionView._onScroll = (e) => {
        onScroll(e);
        this.didScroll();
      };
    }
    this.setState({ filters: props.filters });
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
    const o = this.state;
    o.filters[e.target.name] = e.target.value;
    this.setState(o);

    if (this.props.onChange) {
      this.props.onChange(o.filters);
    }
  }

  didScroll() {
    const scroller = this.scroller._collectionView._scrollingContainer;
    const { scrollTop } = scroller;
    const diff = this.lastScrollTop - scrollTop;
    this.lastScrollTop = scrollTop;
    if (diff > 0) {
      this.setState({ hidden: false });
      this.lastScrollUpPos = scrollTop;
    }
    if (scrollTop - this.lastScrollUpPos > 50) {
      this.setState({ hidden: true });
    }
  }

  render() {
    if (this.state === null) { return null; }

    return (<div className={this.state.hidden ? 'quickOptions hidden' : 'quickOptions'}>
      {/*
            <Button floating className="btn-small">
              <Icon>filter_list</Icon>
            </Button>
            */}
      <Row>
        <Input s={3} name="libraryId" type="select" label="Library:" value={this.state.filters.libraryId} onChange={this.onChange}>
          <option value="">All libraries</option>
          {this.state.settings.libraries.map(lib => (
            <option key={lib.uuid} value={lib.uuid}>{lib.name}</option>
          ))}
        </Input>
        <div className="col search s6">
          <Input s={12} name="title" type="text" label="" defaultValue={this.state.filters.title} onChange={this.onChange} />
          <Button className="mdi-action-search"><Icon>search</Icon></Button>
        </div>
        <Input s={3} name="sort" type="select" label="Sort by:" value={this.state.filters.sort} onChange={this.onChange}>
          <option value="title">Title</option>
          <option value="date_added:DESC">Date added</option>
          <option value="release-date:DESC">Date released</option>
        </Input>
      </Row>
    </div>);
  }
}

export default SearchBar;
