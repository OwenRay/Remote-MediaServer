import { screen, waitFor } from '@testing-library/react-native';
import LibraryScreen from './library';
import * as mediaApi from "../../src/services/api/media";
import {renderWithProviders} from "../../test-utils";


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
});
