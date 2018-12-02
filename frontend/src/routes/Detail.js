/* eslint-disable no-underscore-dangle */
/**
 * Created by owenray on 6/30/2017.
 */
import React, { PureComponent } from 'react';
import { Button, Icon, Tabs, Tab, Modal } from 'react-materialize';
import ReactTooltip from 'react-tooltip';
import BodyClassName from 'react-body-classname';
import { apiActions, deserialize } from 'redux-jsonapi';
import { Redirect } from 'react-router-dom';
import { Flipped } from 'react-flip-toolkit';
import anime from 'animejs';
import TopBar from '../components/TopBar';
import store from '../helpers/stores/apiStore';
import ReadableDuration from '../components/ReadableDuration';
import MediaItemRow from '../components/mediaItem/MediaItemRow';
import MediaInfo from '../components/mediaItem/MediaInfo';

class Detail extends PureComponent {
  constructor() {
    super();
    this.state = {};
    this.toggleWatched = this.toggleWatched.bind(this);
    this.play = this.play.bind(this);
  }

  animateIn(el) {
    anime({
      targets: el,
      opacity: 1,
      easing: 'easeOutSine',
    });
    anime({
      targets: el.querySelector('.container.detail'),
      height: 0,
      duration:500,
      direction: 'reverse',
      easing: 'easeOutSine',
    })
  }

  componentDidMount() {
    this.componentWillReceiveProps(this.props);
  }

  async componentWillReceiveProps(nextProps) {
    if (this.id === nextProps.match.params.id) {
      return;
    }
    this.id = nextProps.match.params.id;
    this.setState({ item: null, id: this.id });

    const item = await store.dispatch(apiActions.read({
      id: nextProps.match.params.id,
      _type: 'media-items',
    }));
    const i = deserialize(item.resources[0], store);
    this.itemModel = i;
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
      item: i,
      showTabs: episodes.length > 1,
      episodes: seasons,
      seasons: Object.keys(seasons),
      watched: i.playPosition && (await i.playPosition()).watched,
    });
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
    if (s.item.type !== 'tv') {
      return (
        <div id="tabs">
          <Tabs defaultValue="0">
            <Tab key={-1} active title="Movie info">
              {this.mediaInfo()}
            </Tab>
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
          </Tabs>
        </div>
      );
    }

    return (
      <div id="tabs">
        <Tabs defaultValue="0">
          <Tab key={-1} active title="Episode info">
            {this.mediaInfo()}
          </Tab>
          {s.seasons.map(season => (
            <Tab key={season} title={!season || season === '0' ? 'Extras' : `Season ${season}`}>
              <div className="scrollable">
                <h1>{s.item.title}</h1>
                <div className="collection">
                  {s.episodes[season].map(episode => (
                    <MediaItemRow key={episode.id} ref={episode.id} mediaItem={episode} />
                  ))}
                </div>
              </div>
            </Tab>))}
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
    this.setState({ playClicked: true });
  }

  render() {
    const s = this.state;
    const id = this.props.match.params.id;
    /*
    if (!s || !s.item) {
      return null;
    } */
    if (s.playClicked) {
      return (<Redirect push to={`/item/view/${id}`} />);
    }
    return (
      <div>
        <Flipped flipId={`media-item${id}`}>
          <div className="movie-detail-backdrop-wrapper">
            <div style={this.backDrop()} className="movie-detail-backdrop" />
            <div style={this.posterLarge()} className="movie-detail-backdrop poster" />
          </div>
        </Flipped>
        <Flipped onAppear={this.animateIn} flipId="page">
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
            </TopBar>

            <div>
              <main>
                <div className="container detail">
                  {s.showTabs ? this.seasonTabs() : this.mediaInfo()}

                  <div className="poster" style={this.poster()} />

                  <Button large floating id="play" icon="play_arrow" onClick={this.play} />

                </div>
              </main>
            </div>
          </div>
        </Flipped>
      </div>
    );
  }
}

export default Detail;
