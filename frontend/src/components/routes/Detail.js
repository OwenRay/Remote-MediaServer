/**
 * Created by owenray on 6/30/2017.
 */
import React, {Component} from 'react';
import TopBar from '../components/TopBar';
import {Button, Icon, Tabs, Tab, Modal} from 'react-materialize';
import ReactTooltip from 'react-tooltip';
import BodyClassName from 'react-body-classname';
import store from '../../stores/apiStore';
import { apiActions, deserialize} from 'redux-jsonapi';
import ReadableDuration from "../components/ReadableDuration";
import MediaItemRow from "../components/mediaItem/MediaItemRow";
import {NavLink} from 'react-router-dom';
import MediaInfo from '../components/mediaItem/MediaInfo';

class Detail extends Component {
  constructor() {
    super();
    this.toggleWatched = this.toggleWatched.bind(this);
  }

  componentDidMount() {
    this.componentWillReceiveProps(this.props);
  }

  async componentWillReceiveProps (nextProps) {
    if(this.id===nextProps.match.params.id) {
      return;
    }
    this.id = nextProps.match.params.id;
    this.setState({item:null});

    const item = await store.dispatch(
      apiActions.read(
        {
          id:nextProps.match.params.id,
          _type:'media-items'
        }
      )
    );
    let i = deserialize(item.resources[0], store);
    this.itemModel = i;
    const readAction = apiActions.read(
      {_type:"media-items"},
      {
        params:
          {
            "external-id": i.externalId,
            "sort": "season,episode",
            "join": "play-position",
            "extra": "false"
          }
      }
    );

    let episodes = await store.dispatch(readAction);
    episodes = episodes.resources.map(o=>deserialize(o, store));
    const seasons = [];
    episodes.forEach(e=>{
      if(!seasons[e.season]) {
        seasons[e.season] = [];
      }
      seasons[e.season].push(e);
    });

    this.setState({
      item:i,
      episodes:seasons,
      seasons:Object.keys(seasons),
      watched:i.playPosition&&(await i.playPosition()).position>(i.fileduration|1)*.97
    });
  }

  backDrop() {
    return {backgroundImage:"url(/img/"+this.state.item.id+"_backdrop.jpg)"};
  }
  poster() {
    return {backgroundImage:"url(/img/"+this.state.item.id+"_poster.jpg)"};
  }

  showTabs() {
    return this.state.item.type==="tv"&&this.state.seasons;
  }

  seasonTabs() {
    if(!this.showTabs()) {
      return null;
    }

    return (
      <div id="tabs">
        <Tabs defaultValue="0">
          <Tab key={-1} active title="Episode info">
            {this.mediaInfo()}
          </Tab>
          {this.state.seasons.map(
            season=><Tab key={season} title={"Season "+season}>
                      <div className="scrollable">
                        <h1>{this.state.item.title}</h1>
                        <div className="collection">
                          {this.state.episodes[season].map(
                            episode => <MediaItemRow key={episode.id} ref={episode.id} mediaItem={episode}/>
                          )}
                        </div>
                      </div>
                    </Tab>
          )}
        </Tabs>
      </div>
    );
  }

  mediaInfo() {
    return (

      <div className="scrollable">
        <h1>{this.state.item.title}</h1>
        <div className="description">
          {this.state.item.type==="tv"?
            <h3>Episode {this.state.item.episode} - {this.state.item.episodeTitle}</h3>:
            ""
          }
          <div className="header">
            <div className="stars">
                <img src="/assets/img/stars.png" alt="stars"/>
                <div className="full" style={{width:this.state.item.rating+"%"}}>
                  <img src="/assets/img/stars-full.png" alt="full_stars"/>
                </div>
            </div>
            <Icon>fiber_manual_record</Icon>
            <ReadableDuration>{this.state.item.fileduration}</ReadableDuration>
            <Icon>fiber_manual_record</Icon>
            {this.state.item.year}
          </div>
          <p>{this.state.item.overview}</p>
        </div>
      </div>
    );
  }

  async toggleWatched()
  {
    let pos = {};
    if(this.itemModel.playPosition) {
      pos = await this.itemModel.playPosition();
    }
    pos._type = 'play-positions';
    pos.position = this.state.watched?0:this.state.item.fileduration|1;
    this.setState({watched:!this.state.watched});
    let posResult = await store.dispatch(apiActions.write(pos));

    if(!pos.id) {
      this.itemModel._type = "media-items";
      this.itemModel.playPosition = ()=>{
        const p = deserialize(posResult.resources[0], store);
        p._type = "play-positions";
        return p;
      };
      store.dispatch(apiActions.write(this.itemModel));
    }
  }

  render() {
    const s = this.state;
    if(!s||!s.item) {
      return null;
    }
    return (
      <div>
          <BodyClassName className="hideNav"></BodyClassName>
          <TopBar showBackButton={true}>
            {s.watched?
              <Button onClick={this.toggleWatched} data-tip="Mark unwatched" className="marked"><Icon>done</Icon></Button>:
              <Button onClick={this.toggleWatched} data-tip="Mark watched"><Icon>done</Icon></Button>
            }
            <Modal
              header={this.state.item.title}
              fixedFooter
              trigger={<Button onClick={this.toggleDetails} data-tip="Info" icon="info_outline"/>}>
              <MediaInfo item={this.state.item}/>
            </Modal>

            <ReactTooltip place="bottom" effect="solid"/>
          </TopBar>
          <div style={this.backDrop()} className="movie-detail-backdrop"></div>
          <div>
            <main>
              <div className="container detail">
                {this.showTabs()?this.seasonTabs():this.mediaInfo()}

                <div className="poster" style={this.poster()}/>

                <Button large floating id="play" icon="play_arrow">
                  <NavLink to={"/item/view/"+s.item.id}/>
                </Button>

              </div>
            </main>
          </div>
      </div>
    );
  }
}

export default Detail;
