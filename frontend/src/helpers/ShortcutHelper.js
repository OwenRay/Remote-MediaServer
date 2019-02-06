/* global window,$ */
const items = {};
let onSuccessfulShortcut = () => {};

class ShortcutArray {
  constructor() {
    this.shortcuts = [];

    this.id = Math.random();
    items[this.id] = this;
  }

  add(keys, func, preventDefault) {
    this.shortcuts.push({ keys, func, preventDefault });
    return this;
  }

  off() {
    delete items[this.id];
  }
}

ShortcutArray.EVENT = {
  PAUSE_PLAY: [32, 80],
  FULLSCREEN: [70, 122],
  UP: [38],
  LEFT: [37],
  RIGHT: [39],
  DOWN: [40],
  SELECT: [32, 13],
  MUTE: [77],
};

window.addEventListener('keydown', (e) => {
  if ($('input:focus').length) return;
  const triggered = Object.values(items)
    .filter(({ shortcuts }) => {
      const a = shortcuts.find(({ keys }) => keys.indexOf(e.keyCode) !== -1);
      if (!a) return false;
      onSuccessfulShortcut(a.func());
      return a.preventDefault;
    });
  if (triggered.length) e.preventDefault();
});

ShortcutArray.setOnSuccessfulShortcut = (func) => {
  onSuccessfulShortcut = func;
};

export default ShortcutArray;
