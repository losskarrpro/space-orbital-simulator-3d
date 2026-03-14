import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { exportPositionsCSV } from '../src/export.js';
import { createCelestialBody } from '../src/bodies.js';
import * as THREE from 'three';

// Mock Three.js et modules
vi.mock('three', () => ({
  Vector3: vi.fn().mockImplementation(() => ({
    x: 0,
    y: 0,
    z: 0,
    clone: vi.fn().mockReturnThis(),
    toArray: vi.fn().mockReturnValue([0, 0, 0])
  }))
}));

const mockBodies = [
  createCelestialBody({
    name: 'Earth',
    radius: 1,
    position: new THREE.Vector3(10, 0, 0),
    velocity: new THREE.Vector3(0, 0.1, 0),
    mass: 5.97e24
  }),
  createCelestialBody({
    name: 'Moon',
    radius: 0.27,
    position: new THREE.Vector3(15, 0, 0),
    velocity: new THREE.Vector3(0, 0.08, 0),
    mass: 7.35e22
  })
];

describe('Export CSV Tests', () => {
  beforeEach(() => {
    // Mock console.log pour capturer sortie CSV
    global.console = {
      ...console,
      log: vi.fn()
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should export valid CSV header', () => {
    exportPositionsCSV(mockBodies, 0);
    
    expect(console.log).toHaveBeenCalledWith(
      'timestamp,name,position.x,position.y,position.z,velocity.x,velocity.y,velocity.z'
    );
  });

  it('should export positions and velocities for all bodies', () => {
    exportPositionsCSV(mockBodies, 123.45);

    const calls = console.log.mock.calls;
    const earthLine = calls.find(call => call[0].includes('Earth'));
    const moonLine = calls.find(call => call[0].includes('Moon'));

    expect(earthLine).toBeDefined();
    expect(earthLine[0]).toMatch(/^123\.45,Earth,10,0,0,0,0\.1,0$/);
    expect(moonLine).toBeDefined();
    expect(moonLine[0]).toMatch(/^123\.45,Moon,15,0,0,0,0\.08,0$/);
  });

  it('should handle single body correctly', () => {
    exportPositionsCSV([mockBodies[0]], 0);

    const calls = console.log.mock.calls;
    expect(calls.length).toBe(2); // header + 1 body
    expect(calls[1][0]).toMatch(/^0,Earth,10,0,0,0,0\.1,0$/);
  });

  it('should handle zero bodies (only header)', () => {
    exportPositionsCSV([], 0);

    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith(
      'timestamp,name,position.x,position.y,position.z,velocity.x,velocity.y,velocity.z'
    );
  });

  it('should format floating point numbers with 6 decimal places', () => {
    const bodyWithFloat = createCelestialBody({
      name: 'Test',
      radius: 1,
      position: new THREE.Vector3(1.23456789, -0.987654321, 3.14159265),
      velocity: new THREE.Vector3(0.123456789, 0.456789123, -0.789123456),
      mass: 1
    });

    exportPositionsCSV([bodyWithFloat], 123.456789);

    const calls = console.log.mock.calls;
    const dataLine = calls[1][0];
    expect(dataLine).toMatch(/^123\.456789,Test,1\.234568,-0\.987654,3\.141593,0\.123457,0\.456789,-0\.789123$/);
  });

  it('should escape commas in body names', () => {
    const bodyWithComma = createCelestialBody({
      name: 'Earth, Main',
      radius: 1,
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      mass: 1
    });

    exportPositionsCSV([bodyWithComma], 0);

    const calls = console.log.mock.calls;
    const dataLine = calls[1][0];
    expect(dataLine).toMatch(/^0,"Earth, Main",0,0,0,0,0,0$/);
  });

  it('should handle negative timestamps', () => {
    exportPositionsCSV(mockBodies, -123.45);

    const calls = console.log.mock.calls;
    const earthLine = calls.find(call => call[0].includes('Earth'));
    expect(earthLine[0]).toMatch(/^-123\.45,Earth/);
  });
});