import React, {useEffect} from 'react';
import {SeekBarAllPlatform, SeekBarProps} from "@/src/features/player/view/SeekBarAllPlatform";

export function SeekBar(props: SeekBarProps) {
  const {max, value, onComplete} = props;

  useEffect(() => {
    if(!document) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        onComplete(Math.min(max, value + 5));
      } else if (event.key === 'ArrowLeft') {
        onComplete(Math.max(0, value - 5));
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyPress);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [max, value, onComplete]);

  return (
    <SeekBarAllPlatform {...props}/>
  );
}
