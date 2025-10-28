import React from 'react';
import { render } from '@testing-library/react-native';
import { Logo } from '../Logo';

describe('Logo', () => {
  it('renders with default size and accessibility label', () => {
    const { getByLabelText } = render(<Logo />);
    expect(getByLabelText('Remote MediaServer logo')).toBeTruthy();
  });

  it('respects custom size', () => {
    const { toJSON } = render(<Logo size={64} />);
    expect(toJSON()).toBeTruthy();
  });
});
