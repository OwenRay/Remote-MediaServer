/* eslint-disable no-underscore-dangle */
/**
 * Created by owenray on 6/30/2017.
 */
/* global window */
import React, { Component } from 'react';
import { apiActions, deserialize } from 'redux-jsonapi';
import { Collection, AutoSizer } from 'react-virtualized';
import { debounce } from 'throttle-debounce';
import store from '../helpers/stores/apiStore';
import SearchBar from '../components/SearchBar';
import MediaItem from '../components/mediaItem/MediaItemTile';
import Filters from '../components/Filters';


class Library extends Component {
  constructor() {
    super();
    this.requestData = this.requestData.bind(this);
    this.onResize = this.onResize.bind(this);
    this.doRequestData = debounce(300, this.doRequestData.bind(this));
    this.cellSizeAndPositionGetter = this.cellSizeAndPositionGetter.bind(this);
    this.onChange = this.onChange.bind(this);
    this.cellRenderer = this.cellRenderer.bind(this);
    /** @type Collection */
    this.state = {
      filters: {}, media: [], rowCount: 0,
    };
    this.promises = [];
    this.pageSize = 25;
    this.colls = Math.floor(window.innerWidth / 165);
    this.offsetLeft = ((window.innerWidth - (this.colls * 165)) / 2) - 15;
  }

  componentDidMount() {
    this.componentWillReceiveProps(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (this.lastLocation === nextProps.location) {
      return;
    }
    this.lastLocation = nextProps.location;
    const filters = {};
    nextProps.location.search
      .substr(1)
      .split('&')
      .forEach((o) => {
        const parts = o.split('=');
        if (parts[0] && parts[1]) {
          filters[parts[0]] = decodeURIComponent(parts[1]);
        }
      });

    this.filters = filters;
    this.promises = [];
    this.setState({ filters, media: [] }, () => {
      if (this.collection) {
        this.collection.recomputeCellSizesAndPositions();
        this.collection.forceUpdate();
      }
      this.loadMore(0, this.pageSize);
    });
  }

  onChange(o) {
    this.setState({ filters: o });
    const url = Object.keys(o).map(key => `${key}=${o[key]}`).join('&');

    clearTimeout(this.waitForUpdate);
    this.waitForUpdate = setTimeout(() => {
      this.props.history.push(`?${url}`);
    }, 500);
  }

  onResize({ width }) {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    this.resizeTimeout = setTimeout(() => {
      this.colls = Math.floor(width / 165);
      this.offsetLeft = ((window.innerWidth - (this.colls * 165)) / 2) - 15;
      if (this.collection) {
        this.collection.recomputeCellSizesAndPositions();
      }
      this.forceUpdate();
    }, 300);
  }

  loadMore(offset, limit) {
    this.lastLoadRequest = new Date().getTime();
    this.minLoad = -1;
    this.maxLoad = 0;
    const items = this.state.media;

    // mark items as loading
    for (let c = offset; c < offset + limit && c < items.length; c += 1) {
      items[c].loading = true;
    }

    const queryParams = { page: { offset, limit } };
    const { filters } = this;
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        queryParams[key] = filters[key];
      }
    });

    if (queryParams.title) {
      queryParams.title = `%${queryParams.title}%`;
    }

    if (this.state.libraries) {
      queryParams.libraries = this.state.libraries;
    }

    queryParams.distinct = 'external-id';
    queryParams.join = 'play-position';
    if (offset === 0) {
      queryParams.filterValues = 'actors,mpaa';
    }
    queryParams.extra = false;

    store.dispatch(apiActions.read(
      { _type: 'media-items' },
      { params: queryParams },
    )).then((res) => {
      const i = res.resources;
      const firstTime = !items.length;

      i.map(o => deserialize(o, store))
        .forEach((o, key) => {
          const index = parseInt(offset + parseInt(key, 10), 10);
          if (o._type !== 'media-item') {
            return;
          }
          items[index] = o;
          if (this.promises[index]) {
            this.promises[index].resolve(o);
            delete this.promises[index];
          }
        });
      for (let c = 0; c < res.meta.totalItems; c += 1) {
        if (!items[c]) {
          items[c] = { index: c };
        }
      }

      if (firstTime) {
        this.setState({
          filterValues: res.meta.filterValues,
          media: items,
          rowCount: res.meta.totalItems,
        });
      }
    });
  }

  requestData(index) {
    if (this.promises[index]) {
      return this.promises[index];
    }
    let r;
    const promise = new Promise((resolve) => { r = resolve; });
    promise.resolve = r;
    if (!this.state.media[index].index) {
      r(this.state.media[index]);
      return promise;
    }
    if (index < this.minLoad || this.minLoad === -1) {
      this.minLoad = index;
    }
    if (index > this.maxLoad) {
      this.maxLoad = index;
    }
    if (this.requestDataTimeout) {
      clearTimeout(this.requestDataTimeout);
    }
    this.doRequestData();

    this.promises[index] = promise;
    return promise;
  }

  doRequestData() {
    this.minLoad -= this.pageSize;
    this.maxLoad += this.pageSize;
    if (this.minLoad < 0) {
      this.minLoad = 0;
    }

    while (!this.state.media[this.minLoad] ||
          !this.state.media[this.minLoad].index ||
          this.state.media[this.minLoad].loading) {
      if (this.minLoad > this.maxLoad) {
        return;
      }
      this.minLoad += 1;
    }
    while (!this.state.media[this.maxLoad]
          || !this.state.media[this.maxLoad].index) {
      if (this.maxLoad < this.minLoad) {
        return;
      }
      this.maxLoad -= 1;
    }
    const count = this.maxLoad - this.minLoad;
    this.loadMore(this.minLoad, count < this.pageSize ? this.pageSize : count);
  }

  cellSizeAndPositionGetter({ index }) {
    return {
      height: 236,
      width: 150,
      x: this.offsetLeft + ((index % this.colls) * 165),
      y: (Math.floor(index / this.colls) * 251) + 65,
    };
  }

  cellRenderer({ index, key, style }) {
    return (
      <MediaItem
        key={key}
        style={style}
        mediaItem={this.state.media[index]}
        requestData={this.requestData}
      />
    );
  }

  render() {
    let collection = <div>Loading</div>;

    if (this.state.media.length) {
      collection = (
        <AutoSizer onResize={this.onResize}>
          {({ width, height }) =>
            (<Collection
              ref={(ref) => { this.collection = ref; }}
              cellCount={this.state.rowCount}
              cellRenderer={this.cellRenderer}
              cellSizeAndPositionGetter={this.cellSizeAndPositionGetter}
              width={width}
              verticalOverscanSize={20}
              height={height}
            />)}
        </AutoSizer>);
    }

    return (
      <div>
        <div className="impagewrapper">
          <SearchBar
            filters={this.state.filters}
            scroller={this.collection}
            onChange={this.onChange}
          />
          {collection}
        </div>
        <Filters
          filters={this.state.filters}
          filterValues={this.state.filterValues}
          onChange={this.onChange}
        />

      </div>
    );
  }
}

export default Library;
