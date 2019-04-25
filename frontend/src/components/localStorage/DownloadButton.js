import React from 'react';
import { Button, Icon } from 'react-materialize';
import LocalStorage from '../../helpers/LocalStorage';

function DownloadButton(props) {
  if (!LocalStorage.isSupported) return null;

  const start = () => {
    window.Materialize.toast('Started download', 3000);
    LocalStorage.download(props.item);
  };

  return (
    <Button
      onClick={start}
      data-tip="Available offline"
    >
      <Icon>file_download</Icon>
    </Button>
  );
}

export default DownloadButton;
