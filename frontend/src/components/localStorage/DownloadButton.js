import React, { PureComponent } from 'react';
import { Button, Icon } from 'react-materialize';
import LocalStorage from '../../helpers/LocalStorage';

class DownloadButton extends PureComponent {
  constructor(props) {
    super(props);
    this.state = { available: false };
    this.onClick = this.onClick.bind(this);
    this.onAvailabilityChange = this.onAvailabilityChange.bind(this);
  }

  componentDidMount() {
    this.offListener = LocalStorage.addListener(
      this.props.item.id,
      null,
      null,
      this.onAvailabilityChange,
      this.onAvailabilityChange,
    );
    this.onAvailabilityChange();
  }

  componentWillUnmount() {
    this.offListener();
  }

  onAvailabilityChange() {
    this.setState({
      available: LocalStorage.isAvailable(this.props.item),
    });
  }

  async onClick() {
    if (this.state.available) {
      LocalStorage.delete(this.props.item);
      return;
    }
    window.Materialize.toast('Starting download', 3000);
    if(!await LocalStorage.download(this.props.item)) {
      window.Materialize.toast('Not enough space, please increase quota', 5000);
    }
  }

  render() {
    if (!LocalStorage.isSupported) return null;
    const { available } = this.state;

    return (
      <Button
        onClick={this.onClick}
        data-tip="Available offline"
      >
        <Icon>{available ? 'delete' : 'file_download'}</Icon>
      </Button>
    );
  }
}

export default DownloadButton;
