import React, { PureComponent } from 'react';
import { Button, Icon } from 'react-materialize';
import LocalStorage from '../../helpers/LocalStorage';

class DownloadButton extends PureComponent {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
    this.onAvailabilityChange = this.onAvailabilityChange.bind(this);
    this.componentWillReceiveProps(props);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.item && nextProps.item.id === this.props.item.id) return;
    if (this.offListener) this.offListener();

    this.offListener = LocalStorage.addListener(
      nextProps.item.id,
      null,
      null,
      this.onAvailabilityChange,
      this.onAvailabilityChange,
    );
  }

  componentWillUnmount() {
    if (this.offListener) this.offListener();
  }

  onAvailabilityChange() {
    this.forceUpdate();
  }

  async onClick() {
    if (LocalStorage.isAvailable(this.props.item)) {
      LocalStorage.delete(this.props.item);
      return;
    }
    window.Materialize.toast('Starting download', 3000);
    if (!await LocalStorage.download(this.props.item)) {
      window.Materialize.toast('Not enough space, please increase quota', 5000);
    }
  }

  render() {
    if (!LocalStorage.isSupported) return null;
    const available = LocalStorage.isAvailable(this.props.item);

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
