
import Phaser from 'phaser';
import { YouTubePlayables } from './YouTubePlayables';
import { Fruit3D } from './three/Fruit3D';
const FRUITS = [
  'hamburger',
  'chicken',
  'fries',
  'coke'
];

export class MemoryMatch extends Phaser.Scene {
  constructor() {
    super('AngryCut');
  }

  preload() {
    for (const key of FRUITS) {
      this.load.image(key, `assets/fruits/${key}.png`);
    }  

    this.load.image('bomb', 'assets/fruits/bomb.png');
    this.load.image('bomb2', 'assets/fruits/bomb2.png');


    this.load.on('loaderror', (file) => {
      console.error('素材載入失敗：', file.src);
    });
  }

  create() {
    this.fruit3D = new Fruit3D(  
     this.game.canvas.parentElement
    );



    this.events.once('shutdown', this.shutdown, this);

    this.score = 0;
    this.seconds = 20;
    this.gameOver = false;
    this.items = [];
    this.lastPointer = null;
    this.spawnEvent = null;

    this.cameras.main.setBackgroundColor('#102a35');

    const w = this.scale.width;
    const h = this.scale.height;

    this.add.text(w / 2, 25, 'Angry Cut', {
      fontSize: '38px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5, 0);

    this.scoreText = this.add.text(18, 85, '得分：0', {
      fontSize: '24px',
      color: '#ffe082'
    });

    this.timeText = this.add.text(w - 18, 85, '時間：20', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(1, 0);

    this.add.text(w / 2, h - 30, '滑動手指或滑鼠切水果！', {
      fontSize: '17px',
      color: '#b8d7dc'
    }).setOrigin(0.5);

    this.slashGraphics = this.add.graphics()
      .setDepth(20);

    this.overlay = this.add.container(0, 0)
      .setDepth(30);

    this.showPanel(
      '切切切大挑戰',
      '20 秒內盡可能切中食物！\n小心炸彈！',
      '開始遊戲',
      () => this.startGame()
    );

    this.input.on('pointerdown', (pointer) => {
      this.lastPointer = {
        x: pointer.x,
        y: pointer.y
      };
    });

    this.input.on('pointermove', (pointer) => {
      if (!pointer.isDown || this.gameOver) return;

      const current = {
        x: pointer.x,
        y: pointer.y
      };

      if (this.lastPointer) {
        this.cutBetween(this.lastPointer, current);
        this.drawSlash(this.lastPointer, current);
      }

      this.lastPointer = current;
    });

    this.input.on('pointerup', () => {
      this.lastPointer = null;
    });

    this.scale.on('resize', () => {
      if (this.gameOver) {
        this.showPanel(
          '切切切大挑戰',
          `得分：${this.score}`,
          '再玩一次',
          () => this.scene.restart()
        );
      }
    });

    YouTubePlayables.firstFrameReady();
    this.syncAudio();
  }

  syncAudio() {
    this.sound.setMute(!YouTubePlayables.isAudioEnabled());

    YouTubePlayables.setAudioChangeCallback((enabled) => {
      this.sound.setMute(!enabled);
    });
  }

  showPanel(title, subtitle, buttonLabel, callback) {
    this.overlay.removeAll(true);

    const w = this.scale.width;
    const h = this.scale.height;

    const shade = this.add.rectangle(
      w / 2, h / 2, w, h, 0x07151c, 0.88
    );

    const heading = this.add.text(
      w / 2, h * 0.36, title, {
        fontSize: '36px',
        fontStyle: 'bold',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: w - 32 }
      }
    ).setOrigin(0.5);

    const detail = this.add.text(
      w / 2, h * 0.46, subtitle, {
        fontSize: '21px',
        color: '#d5e9ee',
        align: 'center',
        lineSpacing: 10,
        wordWrap: { width: w - 40 }
      }
    ).setOrigin(0.5);

    const button = this.add.text(
      w / 2, h * 0.62, buttonLabel, {
        fontSize: '25px',
        fontStyle: 'bold',
        color: '#ffffff',
        backgroundColor: '#16a34a',
        padding: { x: 24, y: 14 }
      }
    ).setOrigin(0.5).setInteractive({ useHandCursor: true });

    button.on('pointerdown', callback);

    this.overlay.add([shade, heading, detail, button]);
  }

  startGame() {
    this.overlay.removeAll(true);
  
    this.gameOver = false;
    this.score = 0;
    this.seconds = 20;
  
    this.scoreText.setText('得分：0');
    this.timeText.setText('時間：20');
  
    // 清理上一局的 3D 物件
    if (this.fruit3D) {
      for (const item of [...this.fruit3D.items]) {
        this.fruit3D.remove(item);
      }
    }
  
    this.items = [];
  
    YouTubePlayables.gameReady();
  
    this.spawnEvent?.remove();
    this.clock?.remove();
  
    this.spawnEvent = this.time.addEvent({
      delay: 1100,
      loop: true,
      callback: this.spawnFruit,
      callbackScope: this
    });
    this.clock = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.gameOver) return;
  
        this.seconds--;
        this.timeText.setText(`時間：${this.seconds}`);
  
        if (this.seconds <= 0) {
          this.finishGame();
        }
      }
    });
  }
  
  

  
spawnFruit() {
  if (this.gameOver || !this.fruit3D) return;

  const width = this.fruit3D.container.clientWidth;
  const height = this.fruit3D.container.clientHeight;

  const isBomb = Math.random() < 0.25;
  const key = isBomb
    ? Phaser.Utils.Array.GetRandom(['bomb', 'bomb2'])
    : Phaser.Utils.Array.GetRandom([
        'hamburger',
        'chicken',
        'fries',
        'coke'
      ]);

  const size = Math.min(160, width * 0.12);

  const x = Phaser.Math.Between(
    Math.floor(width * 0.2),
    Math.floor(width * 0.8)
  );

  // 從畫面底部內側開始
  const y = height - size * 0.4;

  this.fruit3D.spawn(
    key,
    x,
    y,
    size,
    width,
    height
  );
}

  



shutdown() {
  this.fruit3D?.destroy();
  this.fruit3D = null;
}



cutBetween(a, b) {
  if (!this.fruit3D || this.gameOver) return;

  const canvasRect = this.game.canvas.getBoundingClientRect();

  if (!canvasRect.width || !canvasRect.height) return;

  const scaleX = this.scale.width / canvasRect.width;
  const scaleY = this.scale.height / canvasRect.height;

  for (const item of [...this.fruit3D.items]) {
    if (item.cut) continue;

    // 必須在迴圈內取得目前這個 item 的位置
    const pos = this.fruit3D.screenPosition(item);

    const px = (pos.x - canvasRect.left) * scaleX;
    const py = (pos.y - canvasRect.top) * scaleY;

    // 3D 模型的命中半徑換算成 Phaser 遊戲座標
    const radius = Math.max(
      20,
      item.hitRadius * scaleX
    );

    const distance = this.distanceToSegment(
      px,
      py,
      a.x,
      a.y,
      b.x,
      b.y
    );

    if (distance >= radius) continue;

    item.cut = true;

    if (item.isBomb) {
      this.finishGame();
      return;
    }

    this.score += 10;
    this.scoreText.setText(`得分：${this.score}`);

    this.createJuice(px, py);
    this.fruit3D.remove(item);
  }
}


  distanceToSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSq = dx * dx + dy * dy;

    if (lengthSq === 0) {
      return Phaser.Math.Distance.Between(px, py, ax, ay);
    }

    const t = Phaser.Math.Clamp(
      ((px - ax) * dx + (py - ay) * dy) / lengthSq,
      0, 1
    );

    return Phaser.Math.Distance.Between(
      px, py, ax + t * dx, ay + t * dy
    );
  }

  drawSlash(a, b) {
    this.slashGraphics.clear();
    this.slashGraphics.lineStyle(6, 0x9ffcff, 0.9);
    this.slashGraphics.beginPath();
    this.slashGraphics.moveTo(a.x, a.y);
    this.slashGraphics.lineTo(b.x, b.y);
    this.slashGraphics.strokePath();

    this.time.delayedCall(90, () => {
      if (this.slashGraphics.active) {
        this.slashGraphics.clear();
      }
    });
  }

  createJuice(x, y) {
    const colors = [0xff4d6d, 0xffc857, 0x60d394, 0x70d6ff];

    for (let i = 0; i < 8; i++) {
      const dot = this.add.circle(
        x, y, Phaser.Math.Between(3, 7),
        Phaser.Utils.Array.GetRandom(colors)
      ).setDepth(15);

      this.tweens.add({
        targets: dot,
        x: x + Phaser.Math.Between(-55, 55),
        y: y + Phaser.Math.Between(-55, 55),
        alpha: 0,
        scale: 0.2,
        duration: 350,
        onComplete: () => dot.destroy()
      });
    }
  }

  finishGame() {
    if (this.gameOver) return;

    this.gameOver = true;
    this.spawnEvent?.remove();
    this.clock?.remove();

    const best = Math.max(
      this.score,
      Number(this.registry.get('bestScore') || 0)
    );

    this.registry.set('bestScore', best);

    YouTubePlayables.sendScore(this.score);
    void YouTubePlayables.saveData({ bestScore: best });

    this.showPanel(
      '遊戲結束',
      `最終得分：${this.score}\n最高紀錄：${best}`,
      '再玩一次',
      () => this.scene.restart()
    );
  }
}
