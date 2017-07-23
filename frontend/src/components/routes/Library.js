/**
 * Created by owenray on 6/30/2017.
 */
import React, {Component} from 'react';
import store from '../../stores/apiStore';
import {apiActions, deserialize} from 'redux-jsonapi';
import MediaItem from "../components/MediaItem";
import Ingrid from 'react-ingrid';

class Library extends Component {
  constructor() {
    super();
    this.filters = {};
    this.state = {media:[], hasMore:false, page:0};
    this.promises = [];
    this.pageSize = 25;
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
      while(items.length<res.meta.totalItems) {
       items.push({index:items.length-1});
      }

      for (var key in i) {
        var o = deserialize(i[key], api);
        var index = parseInt(offset+parseInt(key));
        items[index] = o;
        if(this.promises[index]) {
          this.promises[index](o);
          delete this.promises[index];
        }
      }
      this.setState({
        media: items,
        page:this.state.page+1,
        hasMore:this.state.page+1<res.meta.totalPages
      });
    });
  }

  requestData(index) {
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

    let r;
    var promise = new Promise((resolve)=>{r=resolve});
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

  render() {
    if (!this.state || !this.state.media.length)
      return <div>Loading</div>;

    const ItemComponent = ({ data }) => {
      return <MediaItem requestData={this.requestData.bind(this)} mediaItem={data}/>
    };

    return (
      <div className="impagewrapper ember-view collection">
        <Ingrid
          ItemComponent={ItemComponent}
          items={this.state.media}
          itemWidth={165}
          itemHeight={233}
          load={this.loadMore.bind(this)}
          more={false}/>
      </div>
    );
  }
}

export default Library;
