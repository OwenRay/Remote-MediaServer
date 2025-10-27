import 'styled-components/native';

declare module 'styled-components/native' {
  export interface DefaultTheme {
    colors: typeof import('@/src/theme').Colors.dark;
  }
}
