import { PhysicsEngine } from '../src/physics.js';
import { CelestialBody } from '../src/bodies.js';

describe('Physics Engine - N-body Integration Tests', () => {
  let physics;
  let bodies;

  beforeEach(() => {
    physics = new PhysicsEngine();
    bodies = [];
  });

  test('should initialize with zero total energy', () => {
    expect(physics.totalEnergy).toBeCloseTo(0, 10);
    expect(physics.totalMomentum).toEqual({ x: 0, y: 0, z: 0 });
  });

  test('single body should maintain constant velocity', () => {
    const body = new CelestialBody({
      name: 'test',
      mass: 1e26,
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 1, y: 0, z: 0 }
    });
    bodies.push(body);
    physics.bodies = bodies;

    const initialEnergy = physics.totalEnergy;
    const initialMomentum = { ...physics.totalMomentum };

    for (let i = 0; i < 100; i++) {
      physics.update(0.01);
    }

    expect(physics.totalEnergy).toBeCloseTo(initialEnergy, 8);
    expect(physics.totalMomentum.x).toBeCloseTo(initialMomentum.x, 10);
    expect(physics.totalMomentum.y).toBeCloseTo(initialMomentum.y, 10);
    expect(physics.totalMomentum.z).toBeCloseTo(initialMomentum.z, 10);
  });

  test('two body circular orbit should conserve energy', () => {
    // Earth-Moon like system
    const earth = new CelestialBody({
      name: 'earth',
      mass: 5.972e24,
      radius: 6371e3,
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 }
    });

    const moon = new CelestialBody({
      name: 'moon',
      mass: 7.342e22,
      radius: 1737e3,
      position: { x: 384400e3, y: 0, z: 0 },
      velocity: { x: 0, y: 1022, z: 0 } // Circular orbit velocity
    });

    bodies.push(earth, moon);
    physics.bodies = bodies;

    const initialEnergy = physics.totalEnergy;

    for (let i = 0; i < 1000; i++) {
      physics.update(86.4); // 1 day in seconds
    }

    expect(physics.totalEnergy).toBeCloseTo(initialEnergy, 6);
  });

  test('three body system should conserve momentum', () => {
    const sun = new CelestialBody({
      name: 'sun',
      mass: 1.989e30,
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 }
    });

    const earth = new CelestialBody({
      name: 'earth',
      mass: 5.972e24,
      position: { x: 149.6e9, y: 0, z: 0 },
      velocity: { x: 0, y: 29780, z: 0 }
    });

    const mars = new CelestialBody({
      name: 'mars',
      mass: 6.39e23,
      position: { x: 0, y: 227.9e9, z: 0 },
      velocity: { x: -24007, y: 0, z: 0 }
    });

    bodies.push(sun, earth, mars);
    physics.bodies = bodies;

    const initialMomentum = { ...physics.totalMomentum };

    for (let i = 0; i < 365 * 10; i++) {
      physics.update(86400); // 1 day
    }

    expect(physics.totalMomentum.x).toBeCloseTo(initialMomentum.x, 8);
    expect(physics.totalMomentum.y).toBeCloseTo(initialMomentum.y, 8);
    expect(physics.totalMomentum.z).toBeCloseTo(initialMomentum.z, 8);
  });

  test('Kepler third law verification for circular orbits', () => {
    const centralMass = 1.989e30; // Sun mass
    const testDistance = 1e11; // 1 AU
    const expectedVelocity = Math.sqrt(6.67430e-11 * centralMass / testDistance);

    const planet = new CelestialBody({
      mass: 5.972e24,
      position: { x: testDistance, y: 0, z: 0 },
      velocity: { x: 0, y: expectedVelocity, z: 0 }
    });

    const sun = new CelestialBody({
      mass: centralMass,
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 }
    });

    bodies.push(sun, planet);
    physics.bodies = bodies;

    // Simulate many orbits
    for (let i = 0; i < 10000; i++) {
      physics.update(3600); // 1 hour
    }

    // Check if planet is back near starting position (orbit complete)
    const finalPos = planet.position;
    expect(Math.abs(finalPos.x - testDistance)).toBeLessThan(testDistance * 0.01);
    expect(Math.abs(finalPos.y)).toBeLessThan(testDistance * 0.01);
  });

  test('energy conservation under numerical integration error tolerance', () => {
    // Highly elliptical orbit test
    const sun = new CelestialBody({
      mass: 1.989e30,
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 }
    });

    const comet = new CelestialBody({
      mass: 1e20,
      position: { x: 1e12, y: 0, z: 0 }, // Very far perihelion
      velocity: { x: 0, y: 1000, z: 0 } // Low velocity
    });

    bodies.push(sun, comet);
    physics.bodies = bodies;

    const initialEnergy = physics.totalEnergy;
    let maxError = 0;

    for (let i = 0; i < 5000; i++) {
      physics.update(86400);
      const energyError = Math.abs(physics.totalEnergy - initialEnergy) / Math.abs(initialEnergy);
      maxError = Math.max(maxError, energyError);
    }

    // Allow 0.1% energy drift for long-term integration
    expect(maxError).toBeLessThan(0.001);
  });

  test('collision detection and handling', () => {
    const body1 = new CelestialBody({
      mass: 1e26,
      radius: 1e7,
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 }
    });

    const body2 = new CelestialBody({
      mass: 1e26,
      radius: 1e7,
      position: { x: 1.5e7, y: 0, z: 0 },
      velocity: { x: -1000, y: 0, z: 0 }
    });

    bodies.push(body1, body2);
    physics.bodies = bodies;

    let collisionCount = 0;
    const originalHandleCollision = physics.handleCollision;
    physics.handleCollision = () => { collisionCount++; };

    // Move them towards collision
    physics.update(20);

    expect(collisionCount).toBeGreaterThan(0);
  });

  test('should handle zero mass bodies gracefully', () => {
    const massless = new CelestialBody({
      mass: 0,
      position: { x: 1e10, y: 0, z: 0 },
      velocity: { x: 0, y: 1000, z: 0 }
    });

    bodies.push(massless);
    physics.bodies = bodies;

    expect(() => physics.update(1)).not.toThrow();
  });
});