import React from 'react';
import { Button, Icon } from 'react-materialize';
import LocalStorage from '../helpers/LocalStorage';

function DownloadButton(props) {
  if (!LocalStorage.isSupported) return null;
  return (
    <Button
      onClick={() => LocalStorage.download(props.item)}
      data-tip="Available offline"
    >
      <Icon>file_download</Icon>
    </Button>
  );
}

export default DownloadButton;
