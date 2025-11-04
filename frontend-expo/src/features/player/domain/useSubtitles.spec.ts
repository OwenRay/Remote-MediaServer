import { parseWebVtt } from './useSubtitles';

describe('parseWebVtt', () => {
  it('parses simple vtt cues', () => {
    const vtt = `WEBVTT\n\n00:00:01.000 --> 00:00:03.000\nHello world!\n\n00:00:04.500 --> 00:00:05.000\nSecond line\n`;
    const cues = parseWebVtt(vtt);
    expect(cues.length).toBe(2);
    expect(cues[0]).toEqual({ start: 1, end: 3, text: 'Hello world!' });
    expect(cues[1]).toEqual({ start: 4.5, end: 5, text: 'Second line' });
  });
});
