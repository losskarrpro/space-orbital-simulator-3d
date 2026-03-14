import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { initControls, updateControls, camera, keys } from '../src/controls.js';
import { scene, renderer } from '../src/main.js';

// Mock Three.js globals
global.THREE = THREE;
global.Math = Object.create(Math); // Allow mocking Math.sin/cos

describe('Controls Module', () => {
  let originalRequestAnimationFrame;
  let mockRafCallback;

  beforeEach(() => {
    // Mock DOM elements
    document.body.innerHTML = `
      <div id="container"></div>
      <div id="ui">
        <input type="range" id="speedSlider" min="0.1" max="10" step="0.1" value="1">
        <input type="range" id="zoomSlider" min="0.1" max="50" step="0.1" value="1">
      </div>
    `;

    // Create minimal scene/renderer mocks
    scene.clear();
    renderer.domElement = { style: {} };

    // Mock RAF
    originalRequestAnimationFrame = window.requestAnimationFrame;
    mockRafCallback = vi.fn();
    window.requestAnimationFrame = (cb) => {
      mockRafCallback = cb;
      return 1;
    };

    // Reset keys
    keys.w = false;
    keys.a = false;
    keys.s = false;
    keys.d = false;
    keys.shift = false;
  });

  afterEach(() => {
    window.requestAnimationFrame = originalRequestAnimationFrame;
    document.body.innerHTML = '';
  });

  describe('initControls', () => {
    it('should initialize camera position and controls correctly', () => {
      initControls();

      expect(camera.position).toMatchObject({
        x: expect.closeTo(0, 10),
        y: expect.closeTo(5, 10),
        z: expect.closeTo(20, 10)
      });
      expect(keys).toMatchObject({
        w: false, a: false, s: false, d: false, shift: false
      });
    });

    it('should add event listeners to document', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      
      initControls();

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('wheel', expect.any(Function));
    });

    it('should setup slider event listeners', () => {
      const speedSlider = document.getElementById('speedSlider');
      const zoomSlider = document.getElementById('zoomSlider');
      
      initControls();

      expect(speedSlider.oninput).toBeDefined();
      expect(zoomSlider.oninput).toBeDefined();
    });
  });

  describe('Keyboard Controls', () => {
    beforeEach(() => {
      initControls();
      camera.position.set(0, 5, 20);
      camera.rotation.set(0, 0, 0);
    });

    it('should move camera forward with W key', () => {
      keys.w = true;
      updateControls(0.016); // 60fps delta

      expect(camera.position.z).toBeCloseTo(-0.8, 1);
    });

    it('should move camera backward with S key', () => {
      keys.s = true;
      updateControls(0.016);

      expect(camera.position.z).toBeCloseTo(20.8, 1);
    });

    it('should strafe left with A key', () => {
      keys.a = true;
      updateControls(0.016);

      expect(camera.position.x).toBeCloseTo(-0.8, 1);
    });

    it('should strafe right with D key', () => {
      keys.d = true;
      updateControls(0.016);

      expect(camera.position.x).toBeCloseTo(0.8, 1);
    });

    it('should move faster with Shift + WASD', () => {
      keys.w = true;
      keys.shift = true;
      updateControls(0.016);

      expect(camera.position.z).toBeCloseTo(-4, 1);
    });
  });

  describe('Mouse Controls', () => {
    beforeEach(() => {
      initControls();
      camera.rotation.set(0, 0, 0);
    });

    it('should rotate camera on mouse move', () => {
      // Simulate mouse movement
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 100,
        movementX: 10,
        movementY: 5
      });
      
      document.dispatchEvent(mouseMoveEvent);
      updateControls(0.016);

      expect(camera.rotation.y).toBeCloseTo(-0.1, 2);
      expect(camera.rotation.x).toBeCloseTo(0.05, 2);
    });

    it('should zoom with mouse wheel', () => {
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: -100 // zoom in
      });

      document.dispatchEvent(wheelEvent);
      updateControls(0.016);

      expect(camera.position.z).toBeLessThan(20);
    });
  });

  describe('Slider Controls', () => {
    it('should update speed from slider', () => {
      initControls();
      
      const speedSlider = document.getElementById('speedSlider');
      speedSlider.value = '2';
      speedSlider.dispatchEvent(new Event('input'));

      expect(window.speedMultiplier).toBe(2);
    });

    it('should update zoom from slider', () => {
      initControls();
      
      const zoomSlider = document.getElementById('zoomSlider');
      zoomSlider.value = '5';
      zoomSlider.dispatchEvent(new Event('input'));

      expect(window.zoomMultiplier).toBe(5);
    });
  });

  describe('updateControls', () => {
    beforeEach(() => {
      initControls();
      camera.position.set(0, 5, 20);
    });

    it('should respect delta time for smooth movement', () => {
      keys.w = true;
      
      updateControls(0.008); // 120fps
      const pos1 = camera.position.z;
      
      updateControls(0.032); // 30fps
      const pos2 = camera.position.z;

      // Movement should be proportional to delta time
      expect(pos2 - pos1).toBeGreaterThan(pos1 - 20);
    });

    it('should clamp camera distance from origin', () => {
      keys.s = true; // move away
      
      for (let i = 0; i < 100; i++) {
        updateControls(0.016);
      }

      expect(camera.position.distanceTo(new THREE.Vector3())).toBeCloseTo(100, 0);
    });
  });

  describe('Integration Test', () => {
    it('should handle continuous WASD + mouse movement smoothly', () => {
      initControls();
      
      // Set keys
      keys.w = true;
      keys.d = true;
      
      // Simulate mouse movement
      const mouseEvent = new MouseEvent('mousemove', {
        movementX: 5,
        movementY: 2
      });
      document.dispatchEvent(mouseEvent);

      // Multiple update cycles
      for (let i = 0; i < 10; i++) {
        updateControls(0.016);
      }

      expect(camera.position.x).toBeGreaterThan(0);
      expect(camera.position.z).toBeLessThan(20);
      expect(camera.rotation.y).toBeCloseTo(-0.05, 2);
    });
  });
});