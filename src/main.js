
import Phaser from 'phaser';
import { YouTubePlayables } from './YouTubePlayables';
import { MemoryMatch } from './MemoryMatch';
import './style.css';

const config = {
  type: Phaser.CANVAS,
  transparent: true,
  parent: 'gameParent',
  backgroundColor: '#101a30',
  scale: {
    mode: Phaser.Scale.EXPAND,
    width: 820,
    height: 1180
  },
  scene: [MemoryMatch],
  input: {
    activePointers: 2
  },
  render: {
    antialias: true
  }
};

YouTubePlayables.boot(() => {
  new Phaser.Game(config);
});
YouTubePlayables.gameReady();