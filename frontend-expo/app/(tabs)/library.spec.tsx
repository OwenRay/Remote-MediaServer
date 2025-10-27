import { screen, waitFor } from '@testing-library/react-native';
import LibraryScreen from './library';
import * as mediaApi from "../../src/features/library/model/media";
import {renderWithProviders} from "../../test-utils";
import {server} from "../../jest.setup";
import {http, HttpResponse} from "msw";


describe('Library', () => {
  it('shows error message when request fails', async () => {
    const isError = true;
    jest.spyOn(mediaApi, 'useLazyGetItemsPagedQuery')
      .mockReturnValue([
        jest.fn().mockReturnValue({unwrap: jest.fn().mockResolvedValue({})}),
        { isFetching: false, isError }
      ]);

    renderWithProviders(<LibraryScreen />);

    await waitFor(() => expect(screen.getByText('Failed to load items.')).toBeTruthy());
  });

  it('shows empty state when no items', async () => {
    server.use(
      http.get('*/api/media-items', () => HttpResponse.json({ data: [] }))
    );

    renderWithProviders(<LibraryScreen />);

    await waitFor(() => {
      expect(screen.getByText('No items found.')).toBeTruthy();
    });
  });
});
