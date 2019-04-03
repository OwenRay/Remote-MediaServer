/* eslint-disable no-underscore-dangle */
/**
 * Created by owenray on 6/30/2017.
 */
/* global window */
import React, { PureComponent } from 'react';
import { apiActions, deserialize } from 'redux-jsonapi';
import { Collection, AutoSizer } from 'react-virtualized';
import { debounce } from 'throttle-debounce';
import { Flipped } from 'react-flip-toolkit';
import ReactTooltip from 'react-tooltip';
import store from '../helpers/stores/apiStore';
import SearchBar from '../components/SearchBar';
import MediaItem from '../components/mediaItem/MediaItemTile';
import Filters from '../components/Filters';
import ShortcutHelper from '../helpers/ShortcutHelper';

const itemsCache = {};

class Library extends PureComponent {
  constructor(props) {
    super(props);
    this.lastScrollUpPos = 0;
    this.requestData = this.requestData.bind(this);
    this.onResize = this.onResize.bind(this);
    this.didScroll = this.didScroll.bind(this);
    this.scrollRef = this.scrollRef.bind(this);
    this.onResize({ width: window.innerWidth });
    this.doRequestData = debounce(300, this.doRequestData.bind(this));
    this.cellSizeAndPositionGetter = this.cellSizeAndPositionGetter.bind(this);
    this.onChange = this.onChange.bind(this);
    this.cellRenderer = this.cellRenderer.bind(this);
    /** @type Collection */
    this.state = {
      filters: { distinct: 'external-id' },
      media: [],
      rowCount: 0,
      loadCount: 0,
      selected: -1,
    };
    this.promises = [];
    this.pageSize = 25;
    this.colls = Math.floor(window.innerWidth / 165);
    this.offsetLeft = ((window.innerWidth - (this.colls * 165)) / 2) - 15;
  }

  componentWillMount() {
    this.shortcuts = new ShortcutHelper()
      .add(ShortcutHelper.EVENT.RIGHT, () => this.moveSelected(1))
      .add(ShortcutHelper.EVENT.UP, () => this.moveSelected(-this.colls), true)
      .add(ShortcutHelper.EVENT.DOWN, () => this.moveSelected(this.colls), true)
      .add(ShortcutHelper.EVENT.LEFT, () => this.moveSelected(-1))
      .add(ShortcutHelper.EVENT.SELECT, this.click.bind(this));
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

    // prevent redraw untill media items have been loaded
    this.filters = filters;
    this.promises = [];
    if (this.collection) {
      this.collection.recomputeCellSizesAndPositions();
      this.collection.forceUpdate();
    }

    this.loadMore(0, this.pageSize, true);
  }

  componentWillUnmount() {
    this.shortcuts.off();
  }

  onChange(o) {
    const filters = o ? { ...this.filters, ...o } : {};
    this.setState({ filters, selected: -1 });
    const url = Object.keys(filters).map(key => `${key}=${filters[key]}`).join('&');

    clearTimeout(this.waitForUpdate);
    this.waitForUpdate = setTimeout(() => {
      this.props.history.push(`?${url}`);
    }, 500);
  }

  onResize({ width }) {
    if (!width) return;
    if (this.lastWidth === width) return;
    this.lastWidth = width;

    this.colls = Math.floor(width / 165);
    this.offsetLeft = ((window.innerWidth - (this.colls * 165)) / 2) - 15;
    if (this.collection) {
      this.collection.recomputeCellSizesAndPositions();
    }
  }

  click() {
    if (this.state.selected === -1 ||
      this.collection._lastRenderedCellIndices.indexOf(this.state.selected) === -1) return;
    this.setState({ click: true });
    this.collection.forceUpdate();
  }

  moveSelected(moveBy) {
    let selected = this.state.selected + moveBy;
    const { _lastRenderedCellIndices } = this.collection;
    if (selected < _lastRenderedCellIndices[0]) [selected] = _lastRenderedCellIndices;
    if (selected > _lastRenderedCellIndices[_lastRenderedCellIndices.length - 1]) {
      selected = _lastRenderedCellIndices[_lastRenderedCellIndices.length - 1];
    }
    this.setState({ selected });
    this.collection.forceUpdate();
  }

  loadMore(offset, limit, fresh) {
    const { filters } = this;

    this.lastLoadRequest = new Date().getTime();
    this.minLoad = -1;
    this.maxLoad = 0;
    // const items = fresh?[]:this.state.media;
    const filterKey = JSON.stringify(filters);
    const cache = itemsCache[filterKey] ? itemsCache[filterKey] : { media: [] };
    const items = cache.media;
    itemsCache[filterKey] = cache;

    // mark items as loading
    let needsLoad = false;
    let overlap = false;
    for (let c = offset; c < offset + limit && c < items.length; c += 1) {
      overlap = true;
      if (items[c].id) {
        continue;
      }
      needsLoad = true;
      items[c].loading = true;
    }
    if (overlap && !needsLoad) {
      this.setState(cache);
      if (this.collection) { this.collection.recomputeCellSizesAndPositions(); }
      return;
    }

    const queryParams = { page: { offset, limit } };
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
      const firstTime = !items.length || fresh;

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
        cache.filters = filters;
        cache.filterValues = res.meta.filterValues;
        cache.loadCount = this.state.loadCount + 1;
        cache.rowCount = res.meta.totalItems;

        this.setState(cache);
        if (this.collection) {
          this.collection.recomputeCellSizesAndPositions();
          this.collection.forceUpdate();
        }
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
        selected={index === this.state.selected}
        click={index === this.state.selected && this.state.click}
        key={this.state.media[index].id || key}
        style={style}
        mediaItem={this.state.media[index]}
        requestData={this.requestData}
      />
    );
  }

  didScroll() {
    const scroller = this.collection._collectionView._scrollingContainer;
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

  scrollRef(ref) {
    this.collection = ref;
    if (!ref || !ref._collectionView) return;
    const onScroll = ref._collectionView._onScroll;
    ref._collectionView._onScroll = (e) => {
      onScroll(e);
      this.didScroll();
    };
  }

  render() {
    let collection = <div>Loading</div>;

    if (this.state.media.length) {
      collection = (
        <AutoSizer onResize={this.onResize}>
          {({ width, height }) =>
            (<Collection
              ref={this.scrollRef}
              cellCount={this.state.rowCount}
              cellRenderer={this.cellRenderer}
              cellSizeAndPositionGetter={this.cellSizeAndPositionGetter}
              width={width}
              verticalOverscanSize={20}
              height={height}
            />)}
        </AutoSizer>
      );
    }

    return (
      <div>
        <Flipped flipId="page">
          <div className="impagewrapper">
            <SearchBar
              className={this.state.hidden ? 'quickOptions hidden' : 'quickOptions'}
              filters={this.state.filters}
              scroller={this.collection}
              onChange={this.onChange}
            />
            {collection}
          </div>
        </Flipped>
        <Filters
          filters={this.state.filters}
          filterValues={this.state.filterValues}
          onChange={this.onChange}
        />
        <ReactTooltip place="bottom" effect="solid" />
      </div>
    );
  }
}

export default Library;
