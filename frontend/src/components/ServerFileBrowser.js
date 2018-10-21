/**
 * Created by owenray on 7/4/2017.
 */
/* global $ */
import React, { Component } from 'react';
import { CollectionItem, Collection, Preloader, Input, Row } from 'react-materialize';
import PropTypes from 'prop-types';

class ServerFileBrowser extends Component {
  constructor(props) {
    super(props);
    this.state = { value: props.value ? props.value : '/' };
    this.valueChange = this.valueChange.bind(this);
  }

  /**
   * set the default value
   */
  componentDidMount() {
    this.update(this.state.value);
  }

  /**
   * called when any of the files or dirs are clicked
   * @param dir
   */
  onClick(dir) {
    let val = this.state.value;
    if (!val.endsWith('/')) {
      val += '/';
    }
    if (dir === '..') {
      const parts = val.split('/');
      parts.pop();
      parts.pop();
      val = parts.join('/');
      if (!val) {
        val = '/';
      }
    } else {
      val += dir;
    }
    this.update(val);
  }

  /**
   * load the contents of the target directory
   * @param val
   */
  update(val) {
    if (this.state !== val) {
      this.props.onChange(val);
    }

    this.setState({ value: val, loading: true });
    $.getJSON(
      '/api/browse',
      { directory: val },
    ).then(
      (data) => { // success
        this.setState({
          loading: false,
          error: data.error ? 'Could not list directory' : '',
          directories: data.result,
        });
      },
      () => { // fail
        this.setState({
          loading: false,
          error: 'Could not list directory',
          directories: [],
        });
      },
    );
  }

  /**
   * helper to go up a directory when clicked
   */
  goUp() {
    return <CollectionItem key=".." onClick={() => { this.onClick('..'); }}>Go up</CollectionItem>;
  }

  /**
   * called when the input value changes
   * @param e
   */
  valueChange(e) {
    this.update(e.target.value);
  }

  render() {
    let contents = <CollectionItem />;

    if (!this.state || this.state.loading) {
      contents = <Preloader flashing />;
    } else if (this.state.error) {
      contents = (
        <Collection>
          {this.goUp()}
          <CollectionItem>{this.state.error}</CollectionItem>
        </Collection>
      );
    } else if (this.state.directories) {
      const dirs = this.state.directories.map(dir => (
        <CollectionItem key={dir} onClick={() => { this.onClick(dir); }}>{dir}</CollectionItem>
      ));
      contents = (
        <Collection>
          {this.goUp()}
          {dirs.length ? dirs : <CollectionItem className="no-link">Empty directory</CollectionItem>}
        </Collection>
      );
    }

    return (
      <div>
        <Row>
          <Input
            ref={(input) => { this.input = input; }}
            onChange={this.valueChange}
            s={12}
            label={this.props.label}
            value={this.state.value}
          />
        </Row>
        <div className="directoryList">
          {contents}
        </div>
      </div>
    );
  }
}

ServerFileBrowser.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default ServerFileBrowser;
