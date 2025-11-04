import { useEffect, useMemo, useState } from 'react';
import {getApiBaseUrl, getBaseUrl} from '@/src/features/shared/model/api/base';

export type VttCue = {
  start: number;
  end: number;
  text: string;
};

export function parseWebVtt(input: string): VttCue[] {
  // Remove BOM and WEBVTT header lines
  const src = input.replace(/^\uFEFF/, '');
  const lines = src.split(/\r?\n/);
  const cues: VttCue[] = [];
  let i = 0;
  // Skip header
  while (i < lines.length && lines[i].trim() !== '') i++;
  // Skip the first empty line after header
  while (i < lines.length && lines[i].trim() === '') i++;

  function toSeconds(ts: string): number {
    // Format: hh:mm:ss.mmm or mm:ss.mmm
    const parts = ts.split(':');
    let h = 0, m = 0;
    let s = 0;
    if (parts.length === 3) {
      h = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      s = parseFloat(parts[2]);
    } else if (parts.length === 2) {
      m = parseInt(parts[0], 10);
      s = parseFloat(parts[1]);
    } else {
      return 0;
    }
    return h * 3600 + m * 60 + s;
  }

  while (i < lines.length) {
    // Optional cue identifier line; skip if it doesn't contain -->
    if (i < lines.length && !lines[i].includes('-->')) {
      // Keep id for potential future use, but skip line
      i++;
      if (i >= lines.length) break;
    }
    if (!lines[i] || !lines[i].includes('-->')) { i++; continue; }
    const timing = lines[i].trim();
    i++;
    const match = timing.match(/(\S+)\s+-->\s+(\S+)/);
    if (!match) continue;
    const start = toSeconds(match[1]);
    const end = toSeconds(match[2]);
    const textLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== '') {
      textLines.push(lines[i]);
      i++;
    }
    // Skip empty line separator
    while (i < lines.length && lines[i].trim() === '') i++;
    if (textLines.length) {
      cues.push({ start, end, text: textLines.join('\n') });
    }
  }
  return cues;
}

export function useSubtitles(id?: string | number, selected?: string | null) {
  const [cues, setCues] = useState<VttCue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setError(undefined);
      setLoading(true);
      setCues([]);
      try {
        console.log('loading subtitles', id, selected);
        if (!id || !selected) { setLoading(false); return; }
        console.log(`${getApiBaseUrl()}/mediacontent/subtitle/${id}/${encodeURIComponent(selected)}`);
        const url = `${getApiBaseUrl()}/mediacontent/subtitle/${id}/${encodeURIComponent(selected)}`;
        const resp = await fetch(url);
        const text = await resp.text();
        console.log(text, cancelled);
        if (cancelled) return;
        const parsed = parseWebVtt(text);
        console.log(text, parsed)
        setCues(parsed);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load subtitles');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => { cancelled = true; };
  }, [id, selected]);

  const getTextAt = useMemo(() => {
    return (timeSec: number) => {
      console.log(timeSec, cues.length);
      if (!cues.length) return '';
      // Binary search could be added, but linear is fine for small files
      for (let i = 0; i < cues.length; i++) {
        const c = cues[i];
        if (timeSec >= c.start && timeSec <= c.end) return c.text;
      }
      return '';
    };
  }, [cues]);

  return { cues, loading, error, getTextAt };
}
