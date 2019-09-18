/* eslint-disable no-underscore-dangle */
/**
 * Created by owenray on 6/30/2017.
 */
import React, { Component } from 'react';
import { Button, Icon, Tabs, Tab, Modal } from 'react-materialize';
import ReactTooltip from 'react-tooltip';
import BodyClassName from 'react-body-classname';
import { apiActions, deserialize } from 'redux-jsonapi';
import { Flipped } from 'react-flip-toolkit';
import TopBar from '../components/TopBar';
import store from '../helpers/stores/store';
import ReadableDuration from '../components/ReadableDuration';
import MediaItemRow from '../components/mediaItem/MediaItemRow';
import MediaInfo from '../components/mediaItem/MediaInfo';
import DownloadButton from '../components/localStorage/DownloadButton';
import LocalStorageProgressForItem from '../components/localStorage/LocalStorageProgressForItem';
import { connect } from 'react-redux';
import { playQueueActions } from '../helpers/stores/playQueue';

class Detail extends Component {
  constructor(props) {
    super(props);
    this.state = { item: null, id: props.match.params.id };
    this.toggleWatched = this.toggleWatched.bind(this);
    this.play = this.play.bind(this);
    this.loadMeta = this.loadMeta.bind(this);
  }

  componentWillMount() {
    this.componentWillReceiveProps(this.props);
  }

  async componentWillReceiveProps(nextProps) {
    if (this.id === nextProps.match.params.id) {
      return;
    }
    this.id = nextProps.match.params.id;

    let item;
    if (store.getState().api.mediaItem) { item = store.getState().api.mediaItem[this.id]; }
    if (!item) {
      item = await store.dispatch(apiActions.read({
        id: nextProps.match.params.id,
        _type: 'media-items',
      }));
      item = item.resources[0];
    }
    const i = deserialize(item, store);
    this.itemModel = i;
    this.setState(
      {
        item: i,
        watched: i.playPosition && (await i.playPosition()).watched,
      },
      () => {
        if (this.animationComplete) this.loadMeta();
      },
    );

    // onAppear is not always triggered, so call loadmeta on timeout as well
    setTimeout(this.loadMeta, 1000);
  }

  backDrop() {
    return { backgroundImage: `url(/img/${this.props.match.params.id}_backdrop.jpg)` };
  }
  poster() {
    return { backgroundImage: `url(/img/${this.props.match.params.id}_poster.jpg)` };
  }
  posterLarge() {
    return { backgroundImage: `url(/img/${this.props.match.params.id}_posterlarge.jpg)` };
  }

  seasonTabs() {
    const s = this.state;
    if (!s.item) return null;
    let title = 'Movie info';
    let tabs;
    if (s.item.type !== 'tv') {
      tabs = (
        <Tab title="Versions">
          <div className="scrollable">
            <h1>{s.item.title}</h1>
            <div className="collection">
              {s.episodes[0].map(item => (
                <MediaItemRow key={item.id} ref={item.id} mediaItem={item} />
              ))}
            </div>
          </div>
        </Tab>
      );
    } else {
      title = 'Episode info';
      tabs = s.seasons.map(season => (
        <Tab key={season} title={!season || season === '0' ? 'Extras' : `Season ${season}`}>
          <div className="scrollable">
            <h1>{s.item.title}</h1>
            <div className="collection">
              {s.episodes[season].map(episode => (
                <MediaItemRow key={episode.id} ref={episode.id} mediaItem={episode} />
              ))}
            </div>
          </div>
        </Tab>));
    }

    return (
      <div id="tabs">
        <Tabs defaultValue="0">
          <Tab key={-1} active title={title}>
            {this.mediaInfo()}
          </Tab>
          {tabs}
        </Tabs>
      </div>
    );
  }

  mediaInfo() {
    const s = this.state;
    if (!s.item) return null;
    return (
      <div className="scrollable">
        <h1>{s.item.title}</h1>
        <div className="description">
          {s.item.type === 'tv' ?
            <h3>Episode {s.item.episode} - {s.item.episodeTitle}</h3> :
            ''
          }
          <div className="header">
            <div className="stars">
              <img src="/assets/img/stars.png" alt="stars" />
              <div className="full" style={{ width: `${s.item.rating}%` }}>
                <img src="/assets/img/stars-full.png" alt="full_stars" />
              </div>
            </div>
            <Icon>fiber_manual_record</Icon>
            <ReadableDuration>{this.state.item.fileduration}</ReadableDuration>
            <Icon>fiber_manual_record</Icon>
            {s.item.year}
          </div>
          <p>{s.item.overview}</p>
        </div>
      </div>
    );
  }

  async toggleWatched() {
    let pos = {};
    if (this.itemModel.playPosition) {
      pos = await this.itemModel.playPosition();
    }
    pos._type = 'play-positions';
    pos.position = this.state.watched ? 0 : this.state.item.fileduration;
    if (!pos.position) pos.position = 0;
    pos.watched = !this.state.watched;

    this.setState({ watched: !this.state.watched });
    const posResult = await store.dispatch(apiActions.write(pos));

    if (!pos.id) {
      this.itemModel._type = 'media-items';
      this.itemModel.playPosition = () => {
        const p = deserialize(posResult.resources[0], store);
        p._type = 'play-positions';
        return p;
      };
      store.dispatch(apiActions.write(this.itemModel));
    }
  }

  play() {
    this.props.insertAtCurrentOffset(this.itemModel);
  }

  async loadMeta(ell) {
    if (ell) ell.style.opacity = 1;
    // make sure metadata only gets loaded after the animation has completed
    // and the item has been loaded
    this.animationComplete = true;
    const i = this.state.item;
    if (!i || this.gotMeta || !i.externalId) return;
    this.gotMeta = true;
    const readAction = apiActions.read(
      { _type: 'media-items' },
      {
        params:
          {
            'external-id': i.externalId,
            sort: 'season,episode',
            join: 'play-position',
            extra: 'false',
          },
      },
    );

    let episodes = await store.dispatch(readAction);
    episodes = episodes.resources.map(o => deserialize(o, store));
    episodes = episodes.filter(o => o._type === 'media-item');
    const seasons = [];
    episodes.forEach((e) => {
      const s = e.season || 0;
      if (!seasons[s]) {
        seasons[s] = [];
      }
      seasons[s].push(e);
    });

    this.setState({
      showTabs: episodes.length > 1,
      episodes: seasons,
      seasons: Object.keys(seasons),
    });
  }

  render() {
    const s = this.state;
    const id = this.props.match.params.id;

    return (
      <div>
        <Flipped flipId={`media-item${id}`} onAppear={this.loadMeta} onComplete={this.loadMeta}>
          <div className="movie-detail-backdrop-wrapper">
            <div style={this.backDrop()} className="movie-detail-backdrop" />
            <div style={this.posterLarge()} className="movie-detail-backdrop poster" />
          </div>
        </Flipped>
        <div>
          <BodyClassName className="hideNav" />
          <TopBar showBackButton>
            {s.item && s.item.externalId ? (
              <a
                rel="noopener noreferrer"
                href={`/api/redirectToIMDB/${id}`}
                target="_blank"
              >
                <img alt="IMDB" src="/assets/img/imdb.svg" />
              </a>) :
                ''
              }
            <DownloadButton item={this.state.item || { id }} />
            {s.watched ?
              <Button onClick={this.toggleWatched} data-tip="Mark unwatched" className="marked"><Icon>done</Icon></Button> :
              <Button onClick={this.toggleWatched} data-tip="Mark watched"><Icon>done</Icon></Button>
                }
            <Modal
              header={s.item ? s.item.title : ''}
              fixedFooter
              trigger={<Button onClick={this.toggleDetails} data-tip="Info" icon="info_outline" />}
            >
              <MediaInfo item={this.state.item} />
            </Modal>

            <ReactTooltip place="bottom" effect="solid" />
            <LocalStorageProgressForItem item={s.item} />
          </TopBar>

          <div>
            <main>
              <Flipped flipId="page">
                <div className="container detail">
                  <div className="blurred">
                    <div className="movie-detail-backdrop-wrapper">
                      <div style={this.backDrop()} className="movie-detail-backdrop" />
                      <div style={this.posterLarge()} className="movie-detail-backdrop poster" />
                    </div>
                  </div>
                  {s.showTabs ? this.seasonTabs() : this.mediaInfo()}
                  <div className="poster" style={this.poster()} />
                  <Button large floating id="play" icon="play_arrow" onClick={this.play} />
                </div>
              </Flipped>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(null, playQueueActions)(Detail);
