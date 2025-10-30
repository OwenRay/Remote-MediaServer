import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { LibrariesEditor } from './LibrariesEditor';
import { SettingsAttributes } from '@/src/features/settings/model/settings';
import {renderWithProviders} from "../../../../test-utils";

const draftBase: SettingsAttributes = {
  name: 'Server',
  port: 8234,
  filewatcher: 'native',
  startscan: false,
  modules: [],
  libraries: [
    { name: 'Movies', type: 'folder', folder: '/' },
  ],
};

describe('LibrariesEditor - Browse directories', () => {
  beforeEach(() => {
    // @ts-ignore
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ error: undefined, result: ['media', 'downloads'] }),
    });
  });

  it('opens edit dialog, browses server directories and saves folder change', async () => {
    const setDraft = jest.fn();
    const { getByText, queryByText, getAllByLabelText } = renderWithProviders(<LibrariesEditor draft={draftBase} setDraft={setDraft} />);

    // Open edit dialog for first library
    const editButtons = getAllByLabelText('Edit library');
    fireEvent.press(editButtons[0]);

    // Open browse modal from dialog
    fireEvent.press(getByText('Browse'));

    // Wait for directories to appear
    await waitFor(() => expect(getByText('media')).toBeTruthy());

    // Enter the directory
    fireEvent.press(getByText('media'));

    // Select folder
    await waitFor(() => expect(getByText('Select Folder')).toBeTruthy());
    fireEvent.press(getByText('Select Folder'));

    // Save dialog
    fireEvent.press(getByText('Save'));

    // Expect setDraft called with updated folder path
    expect(setDraft).toHaveBeenCalled();
    const lastCall = setDraft.mock.calls[setDraft.mock.calls.length - 1][0] as SettingsAttributes;
    expect(lastCall.libraries[0].folder).toBe('/media');

    // Modal closed
    await waitFor(() => expect(queryByText('Select Folder')).toBeNull());
  });
});
