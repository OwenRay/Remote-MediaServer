import React from 'react';
import { DefaultTheme, default as styled } from 'styled-components/native';
import type { TextProps } from 'react-native';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

type RequiredType = Required<Pick<ThemedTextProps, 'type'>>;

const BaseText = styled.Text<RequiredType>`
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.text};
  ${({ type }: RequiredType) => (type === 'default' ? 'font-size: 13px; line-height: 24px;' : '')}
  ${({ type }: RequiredType) => (type === 'defaultSemiBold' ? 'font-size: 16px; line-height: 24px; font-weight: 600;' : '')}
  ${({ type }: RequiredType) => (type === 'title' ? 'font-size: 32px; line-height: 32px; font-weight: bold;' : '')}
  ${({ type }: RequiredType) => (type === 'subtitle' ? 'font-size: 20px; font-weight: bold;' : '')}
  ${({ type, theme }: RequiredType & { theme: DefaultTheme }) => (type === 'link' ? `line-height: 30px; font-size: 16px; color: ${theme.colors.tint};` : '')}
`;

export function ThemedText({ type = 'default', style, ...rest }: ThemedTextProps) {
  return <BaseText type={type} style={style} {...rest} />;
}
