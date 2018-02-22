import React, {Component} from 'react';
import libjass from "libjass";


class Subtitles extends Component {
  componentDidMount() {
    window.addEventListener("resize", this.onVideoResize.bind(this));
  }

  componentWillUnmount(){
    this.removeSubs();
    window.removeEventListener("resize", this.onVideoResize.bind(this));
  }

  gotRef(ref) {
    this.subsRef = ref;
  }

  removeSubs() {
    if(this.renderer){
      this.renderer.disable();
      this.clock.disable();
    }
  }

  componentWillReceiveProps(newProps) {
    if(!newProps.file) {
      this.removeSubs();
      return;
    }
    if(this.props.file===newProps.file&&this.haveSubs) {
      if(this.clock) {
        this.clock.tick(newProps.progress);
      }
      return;
    }

    this.haveSubs = true;
    libjass.ASS.fromUrl("/api/mediacontent/subtitle/"+newProps.item.id+"/"+newProps.file)
      .then(ass=>{
        this.removeSubs();
        this.clock = new libjass.renderers.ManualClock();
        this.renderer = new libjass.renderers.WebRenderer(
          ass,
          this.clock,
          this.subsRef
        );
        this.clock.setEnabled(true);
        this.onVideoResize();
        newProps.vidRef.play();
      });
  }

  onVideoResize(){
    if(this.renderer) {
      const v = this.props.vidRef;
      const vw = v.offsetWidth, vh = v.offsetHeight;
      const ow = v.videoWidth, oh = v.videoHeight;
      if(vw/vh<ow/oh){
        this.renderer.resize(vw, vw*(oh/ow), 0, vh/2-(vw*(oh/ow))/2);
      }else{
        this.renderer.resize(vh*(ow/oh), vh, vw/2-(vh*(ow/oh))/2, 0);
      }
    }
  }

  render() {
    return <div ref={this.gotRef.bind(this)}/>
  }
}

export default Subtitles;
