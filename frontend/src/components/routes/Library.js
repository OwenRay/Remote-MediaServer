/**
 * Created by owenray on 6/30/2017.
 */
import React, {Component} from 'react';
import store from '../../stores/apiStore';
import {apiActions, deserialize} from 'redux-jsonapi';
import MediaItem from "../components/MediaItem";
import { Collection, AutoSizer} from 'react-virtualized';

class Library extends Component {
  constructor() {
    super();
    this.filters = {};
    this.state = {media:[], hasMore:false, page:0};
    this.media = [];
    this.promises = [];
    this.pageSize = 25;
    this.colls = 2;
  }

  componentWillMount() {
    this.loadMore(0,this.pageSize);
  }

  loadMore(offset, limit) {
    this.minLoad = -1;
    this.maxLoad = 0;

    var queryParams = {page: {offset:offset, limit: limit}};
    var filters = this.filters;
    for (var key in this.filters) {
      queryParams[key] = filters[key];
    }

    if (this.state.title) {
      queryParams.title = "%" + this.state.title + "%";
    }

    if (this.state.libraries) {
      queryParams.libraries = this.state.libraries;
    }

    queryParams.distinct = "external-id";
    queryParams.join = "play-position";
    queryParams.extra = false;

    store.dispatch(apiActions.read(
      {_type: 'media-items'},
      {"params": queryParams}
    )).then((res) => {
      const i = res.resources;
      const items = this.state.media;
      const { api } = store.getState();
      const firstTime = !items.length;


      for (var key in i) {
        var index = parseInt(offset+parseInt(key));
        var o = deserialize(i[key], api);
        items[index] = o;
        if(this.promises[index]) {
          this.promises[index](o);
          delete this.promises[index];
        }
      }
      for(let c = 0; c<res.meta.totalItems; c++) {
        if(!items[c]) {
          items[c] = {index: c};
        }
      }
      if(firstTime) {
        console.log("setstate!");
        this.setState({
          media:items,
          rowCount:res.meta.totalItems
        });
      }
    });
  }

  requestData(index) {
    let r;
    const promise = new Promise((resolve)=>{r=resolve});
    if(!this.state.media[index].index) {
      r(this.state.media[index]);
      return promise;
    }
    if(index<this.minLoad||this.minLoad===-1) {
      this.minLoad = index;
    }
    if(index>this.maxLoad) {
      this.maxLoad = index;
    }
    if(this.requestDataTimeout) {
      clearTimeout(this.requestDataTimeout);
    }
    this.requestDataTimeout = setTimeout(this.doRequestData.bind(this), 300);

    this.promises[index] = r;
    return promise;
  }

  doRequestData() {
    this.minLoad-=this.pageSize;
    this.maxLoad+=this.pageSize;
    while(!this.state.media[this.minLoad]||!this.state.media[this.minLoad].index) {
      this.minLoad++;
    }
    while(!this.state.media[this.maxLoad]||!this.state.media[this.maxLoad].index) {
      this.maxLoad--;
    }
    var count = this.maxLoad-this.minLoad;
    this.loadMore(this.minLoad, count<this.pageSize?this.pageSize:count);
  }

  onResize({width}) {
    console.log("resize", width)
    if(this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    this.resizeTimeout = setTimeout(()=>{
      this.colls = Math.floor(width/165);
      this.collection.recomputeCellSizesAndPositions();
      this.forceUpdate();
    }, 300);
  }

  cellSizeAndPositionGetter ({ index }) {
    console.log("getter");
    return {
      height: 236,
      width: 150,
      x: index%this.colls*165,
      y: Math.floor(index/this.colls)*251
    }
  }

  cellRenderer({ index, key, style }) {
    return <MediaItem
      key={key}
      style={style}
      mediaItem={this.state.media[index]}
      requestData={this.requestData.bind(this)} />
  }

  render() {
    if (!this.state || !this.state.media.length)
      return <div>Loading</div>;

    return (
      <div className="impagewrapper ember-view collection">
        <AutoSizer onResize={this.onResize.bind(this)} >
          {({ width, height }) =>
            <Collection
              ref={ref=>{this.collection=ref}}
              cellCount={this.state.rowCount}
              cellRenderer={this.cellRenderer.bind(this)}
              cellSizeAndPositionGetter={this.cellSizeAndPositionGetter.bind(this)}
              width={width}
              verticalOverscanSize={10}
              height={height}>
            </Collection>}
        </AutoSizer>
      </div>
    );
  }
}

export default Library;
