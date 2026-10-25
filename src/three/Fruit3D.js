
import * as THREE from 'three';

export class Fruit3D {
  constructor(container) {
    this.container = container;
    this.items = [];
    this.running = true;

    if (getComputedStyle(container).position === 'static') {
      container.style.position = 'relative';
    }

    this.scene = new THREE.Scene();

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 640;

    // 正交相機：世界座標直接使用畫面像素
    this.camera = new THREE.OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      0.1,
      1000
    );

    this.camera.position.set(0, 0, 100);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'default'
    });

    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 1.5)
    );
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    Object.assign(this.renderer.domElement.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      width: '100%',
      height: '100%',
      display: 'block',
      pointerEvents: 'none',
      zIndex: '2'
    });

    container.appendChild(this.renderer.domElement);

    this.scene.add(
      new THREE.HemisphereLight(0xffffff, 0x243040, 2)
    );

    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(-3, 6, 20);
    this.scene.add(light);

    this.clock = new THREE.Clock();

    this.resize = this.resize.bind(this);
    this.animate = this.animate.bind(this);

    window.addEventListener('resize', this.resize);



    console.log('[Fruit3D] Renderer 狀態', {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
      canvas: this.renderer.domElement,
      parent: this.renderer.domElement.parentElement
    });


    this.resize();
    this.animate();
  }

  material(color, roughness = 0.4) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness: 0
    });
  }

  makeFood(key) {
    const group = new THREE.Group();

    const add = (geometry, color, x, y, z = 0) => {
      const mesh = new THREE.Mesh(
        geometry,
        this.material(color)
      );

      mesh.position.set(x, y, z);
      group.add(mesh);
      return mesh;
    };

    const sphere = (
      color, x, y, sx, sy, sz = 0.3
    ) => {
      const mesh = add(
        new THREE.SphereGeometry(1, 24, 16),
        color, x, y
      );

      mesh.scale.set(sx, sy, sz);
      return mesh;
    };

    if (key === 'hamburger') {
      sphere(0xd9953b, 0, 0.3, 0.8, 0.3);
      sphere(0xe7ad55, 0, -0.15, 0.78, 0.22);
      sphere(0x6b301b, 0, 0.03, 0.73, 0.17);
      sphere(0x55ad48, 0, 0.13, 0.76, 0.08);
      sphere(0xf4d15e, 0, 0.2, 0.72, 0.06);

    } else if (key === 'chicken') {
      sphere(0xc77b27, 0, 0, 0.52, 0.65);
      sphere(0xe6b35d, -0.3, -0.25, 0.3, 0.32);
      sphere(0xe6b35d, 0.3, 0.2, 0.3, 0.35);

    } else if (key === 'fries') {
      add(
        new THREE.BoxGeometry(0.95, 0.85, 0.35),
        0xd92f32, 0, -0.28
      );

      for (let i = 0; i < 5; i++) {
        const fry = add(
          new THREE.BoxGeometry(0.16, 0.95, 0.22),
          0xffd04a,
          (i - 2) * 0.19,
          0.1
        );

        fry.rotation.z = (i - 2) * 0.07;
      }

    } else if (key === 'coke') {
      add(
        new THREE.CylinderGeometry(0.38, 0.3, 1.25, 24),
        0xd82e35, 0, -0.05
      );

      add(
        new THREE.CylinderGeometry(0.34, 0.34, 0.08, 24),
        0xbfcbd1, 0, 0.62
      );

      add(
        new THREE.CylinderGeometry(0.055, 0.055, 0.8, 12),
        0x63d9ed, 0.12, 0.95
      );

    } else if (key === 'bomb' || key === 'bomb2') {
      const red = key === 'bomb2';

      sphere(
        red ? 0xb91c1c : 0x242b35,
        0, 0, 0.58, 0.58, 0.48
      );

      const fuse = add(
        new THREE.CylinderGeometry(0.06, 0.06, 0.3, 8),
        0xf6c453, 0, 0.64
      );

      fuse.rotation.z = -0.35;

      sphere(
        red ? 0xffd166 : 0xff6b35,
        0.18, 0.18, 0.12, 0.12, 0.12
      );
    }

    return group;
  }

  

  spawn(key, x, y, size, width, height) {
    const object = this.makeFood(key);
  
    // Three.js 正交相機使用像素作為世界座標
    const worldX = x - width / 2;
    const worldY = height / 2 - y;
  
    object.position.set(worldX, worldY, 0);
    object.scale.setScalar(size / 1.6);
    object.rotation.z = Math.random() * Math.PI;
  
    this.scene.add(object);
  
    const item = {
      key,
      object,
      born: this.clock.elapsedTime,
      startX: worldX,
      startY: worldY,
      vx: (Math.random() - 0.5) * 180,
      vy: 1100,
      cut: false,
      isBomb: key === 'bomb' || key === 'bomb2',
      hitRadius: size * 0.48
    };
  
    this.items.push(item);
  
    console.log('[Fruit3D] 已生成', {
      key,
      x: worldX,
      y: worldY,
      scale: object.scale.x,
      count: this.items.length
    });
  
    return item;
  }
  


  screenPosition(item) {
    const vector = item.object.position.clone();
    vector.project(this.camera);

    const rect = this.renderer.domElement.getBoundingClientRect();

    return {
      x: rect.left + (vector.x + 1) * 0.5 * rect.width,
      y: rect.top + (1 - vector.y) * 0.5 * rect.height
    };
  }


  resize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
  
    if (!width || !height || !this.renderer) return;
  
    // Three.js 相機與實際容器使用相同尺寸
    this.camera.left = -width / 2;
    this.camera.right = width / 2;
    this.camera.top = height / 2;
    this.camera.bottom = -height / 2;
  
    this.camera.near = 0.1;
    this.camera.far = 1000;
    this.camera.position.set(0, 0, 100);
    this.camera.lookAt(0, 0, 0);
  
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  
    console.log('[Fruit3D] resize', {
      width,
      height,
      cameraLeft: this.camera.left,
      cameraRight: this.camera.right
    });
  }
  
  

  update(delta) {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
  
    if (!width || !height) return;
  
    for (const item of [...this.items]) {
      if (item.cut) continue;
  
      const t = this.clock.elapsedTime - item.born;
      const obj = item.object;
  
      // 從畫面下方往上拋，再往下掉
      obj.position.x = item.startX + item.vx * t;

  
      obj.position.y =
      item.startY + item.vy * t - 700 * t * t;



      obj.rotation.x += delta * 0.8;
      obj.rotation.y += delta * 1.2;
  
      // 使用 Three.js 投影後的畫面座標判斷是否離場
      const pos = this.screenPosition(item);
      const rect = this.renderer.domElement.getBoundingClientRect();
  
      if (
        pos.y > rect.height + 150 ||
        pos.x < -150 ||
        pos.x > rect.width + 150
      ) {
        this.remove(item);
      }
    }
  }
  

  remove(item) {
    this.scene.remove(item.object);

    item.object.traverse((obj) => {
      if (!obj.isMesh) return;

      obj.geometry.dispose();
      obj.material.dispose();
    });

    this.items = this.items.filter(
      value => value !== item
    );
  }

  animate() {
    if (!this.running) return;

    this.frameId = requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.update(delta);
    this.renderer.render(this.scene, this.camera);

  }

  destroy() {
    if (!this.running) return;

    this.running = false;
    cancelAnimationFrame(this.frameId);

    window.removeEventListener('resize', this.resize);

    for (const item of [...this.items]) {
      this.remove(item);
    }

    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
