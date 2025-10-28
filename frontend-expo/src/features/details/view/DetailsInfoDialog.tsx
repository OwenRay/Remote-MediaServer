import React from 'react';
import { Modal, Pressable } from 'react-native';
import {default as styled} from 'styled-components/native';
import { ThemedText } from '@/src/features/shared/view/themed-text';
import { SecondaryButton } from '@/src/features/shared/view/SecondaryButton';
import {MediaItem} from "@/src/features/library/model/media";

export type DetailsInfoDialogProps = {
  visible: boolean;
  onClose: () => void;
  item: MediaItem | null | undefined;
  subTitle?: string | null;
};

export function DetailsInfoDialog({ visible, onClose, item, subTitle }: DetailsInfoDialogProps) {
  if (!item) return null;

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="fade">
      <ModalBackdrop as={Pressable} onPress={onClose} accessibilityLabel="Close info modal backdrop">
        <ModalCard>
          {item.title ? <Title type="title">{item.title}</Title> : null}
          {subTitle ? <SubTitle>{subTitle}</SubTitle> : null}
          <Rows>
            {renderRow('File:', item.filepath)}
            {renderRow('Media type:', item.mediaType)}
            {renderRow('Media dimensions:', formatDims(item.width, item.height))}
            {renderRow('Duration:', formatDuration(item.fileduration))}
            {renderRow('Bitrate:', item.bitrate != null ? `${formatFileSize(item.bitrate)}ps` : undefined)}
            {renderRow('Filesize:', item.filesize != null ? formatFileSize(item.filesize) : undefined)}
            {renderRow('Date added:', item.dateAdded != null ? new Date(item.dateAdded).toDateString() : undefined)}
            {renderRow('Release date', item.releaseDate ?? undefined)}
            {renderRow('Episode title:', item.episodeTitle ?? undefined)}
            {renderRow('Season', item.season ?? undefined)}
            {renderRow('Episode', item.episode ?? undefined)}
          </Rows>
          <Actions>
            <Secondary onPress={onClose} accessibilityLabel="Close info">
              <SecondaryText>Close</SecondaryText>
            </Secondary>
          </Actions>
        </ModalCard>
      </ModalBackdrop>
    </Modal>
  );
}

function renderRow(label: string, value: string | number | undefined) {
  if (value === undefined || value === '') return null;
  return (
    <Row key={label}>
      <CellLabel type="default">{label}</CellLabel>
      <CellValue type="default">{String(value)}</CellValue>
    </Row>
  );
}

function formatDims(w?: number | null, h?: number | null): string | undefined {
  if (w == null || h == null) return undefined;
  return `${w}x${h}`;
}

function formatDuration(seconds?: number | null): string | undefined {
  if (seconds == null || Number.isNaN(seconds)) return undefined;
  const s = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${mins}:${String(sec).padStart(2, '0')}`;
}

function formatFileSize(bytes?: number): string {
  if(!bytes) return '';
  const thresh = 1024;
  if (Math.abs(bytes) < thresh) {
    return `${bytes} B`;
  }
  const units = ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let u = -1;
  let val = bytes;
  do {
    val /= 1024;
    ++u;
  } while (Math.abs(val) >= thresh && u < units.length - 1);
  return `${val.toFixed(val >= 100 ? 0 : val >= 10 ? 1 : 2)} ${units[u]}`;
}

const ModalBackdrop = styled.View`
  flex: 1;
  background-color: rgba(0,0,0,0.7);
  justify-content: center;
  align-items: center;
`;

const ModalCard = styled.View`
  width: 90%;
  background-color: #222;
  border-radius: 8px;
  padding: 16px;
`;

const Title = styled(ThemedText)`
  font-weight: 700;
  font-size: 20px;
`;

const SubTitle = styled(ThemedText)`
  opacity: 0.9;
  margin-bottom: 8px;
`;

const Rows = styled.View`
  margin-top: 8px;
`;

const Row = styled.View`
  flex-direction: row;
  gap: 8px;
  padding-vertical: 6px;
`;

const CellLabel = styled(ThemedText)`
  width: 120px;
  font-weight: 700;
`;

const CellValue = styled(ThemedText)`
  flex: 1;
`;

const Actions = styled.View`
  flex-direction: row;
  gap: 12px;
  margin-top: 16px;
`;

const Secondary = styled(SecondaryButton)`
  background-color: #444;
`;

const SecondaryText = styled(ThemedText)`
  color: white;
  font-weight: 700;
`;
