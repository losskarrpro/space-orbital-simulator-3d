// src/physics.js - Moteur N-body réaliste avec intégration RK4
import { Vector3 } from 'three';

const G = 6.67430e-11; // Constante gravitationnelle
const DT = 0.01; // Pas de temps fixe pour stabilité
const EPSILON = 1e-10; // Évitement collision

export class PhysicsEngine {
  constructor(bodies, timeScale = 1.0) {
    this.bodies = bodies;
    this.timeScale = timeScale;
    this.paused = false;
    
    // États pour RK4
    this.k1_pos = bodies.map(() => new Vector3());
    this.k1_vel = bodies.map(() => new Vector3());
    this.k2_pos = bodies.map(() => new Vector3());
    this.k2_vel = bodies.map(() => new Vector3());
    this.k3_pos = bodies.map(() => new Vector3());
    this.k3_vel = bodies.map(() => new Vector3());
    this.k4_pos = bodies.map(() => new Vector3());
    this.k4_vel = bodies.map(() => new Vector3());
    
    this.tmpPos = bodies.map(() => new Vector3());
    this.tmpVel = bodies.map(() => new Vector3());
  }

  setTimeScale(scale) {
    this.timeScale = scale;
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  update(deltaTime) {
    if (this.paused) return;
    
    const dt = DT * this.timeScale * deltaTime;
    
    this.integrateRK4(dt);
    
    // Mise à jour des matrices de transformation
    this.bodies.forEach((body, i) => {
      body.mesh.position.copy(this.bodies[i].position);
      
      // Rotation auto des corps
      body.mesh.rotation.y += body.angularVelocity * dt;
      
      // Mise à jour rayon d'affichage basé sur distance caméra (LOD)
      this.updateDisplayRadius(body);
    });
  }

  integrateRK4(dt) {
    const n = this.bodies.length;
    
    // k1
    this.computeAccelerations(this.bodies, this.k1_vel);
    for (let i = 0; i < n; i++) {
      this.k1_pos[i].copy(this.bodies[i].velocity).multiplyScalar(dt);
    }
    
    // k2
    for (let i = 0; i < n; i++) {
      this.tmpPos[i].copy(this.bodies[i].position).add(this.k1_pos[i].clone().multiplyScalar(0.5));
      this.tmpVel[i].copy(this.bodies[i].velocity).add(this.k1_vel[i].clone().multiplyScalar(0.5));
    }
    this.computeAccelerations(this.tmpPos, this.tmpVel, this.k2_vel);
    for (let i = 0; i < n; i++) {
      this.k2_pos[i].copy(this.tmpVel[i]).multiplyScalar(dt);
    }
    
    // k3
    for (let i = 0; i < n; i++) {
      this.tmpPos[i].copy(this.bodies[i].position).add(this.k2_pos[i].clone().multiplyScalar(0.5));
      this.tmpVel[i].copy(this.bodies[i].velocity).add(this.k2_vel[i].clone().multiplyScalar(0.5));
    }
    this.computeAccelerations(this.tmpPos, this.tmpVel, this.k3_vel);
    for (let i = 0; i < n; i++) {
      this.k3_pos[i].copy(this.tmpVel[i]).multiplyScalar(dt);
    }
    
    // k4
    for (let i = 0; i < n; i++) {
      this.tmpPos[i].copy(this.bodies[i].position).add(this.k3_pos[i]);
      this.tmpVel[i].copy(this.bodies[i].velocity).add(this.k3_vel[i]);
    }
    this.computeAccelerations(this.tmpPos, this.tmpVel, this.k4_vel);
    for (let i = 0; i < n; i++) {
      this.k4_pos[i].copy(this.tmpVel[i]).multiplyScalar(dt);
    }
    
    // Mise à jour finale
    for (let i = 0; i < n; i++) {
      const posUpdate = this.k1_pos[i]
        .add(this.k2_pos[i])
        .add(this.k2_pos[i])
        .add(this.k3_pos[i])
        .add(this.k3_pos[i])
        .add(this.k4_pos[i])
        .multiplyScalar(1/6);
      
      const velUpdate = this.k1_vel[i]
        .add(this.k2_vel[i])
        .add(this.k2_vel[i])
        .add(this.k3_vel[i])
        .add(this.k3_vel[i])
        .add(this.k4_vel[i])
        .multiplyScalar(1/6);
      
      this.bodies[i].position.add(posUpdate);
      this.bodies[i].velocity.add(velUpdate);
    }
  }

  computeAccelerations(positions, velocities, accelerations = null) {
    const n = this.bodies.length;
    const acc = accelerations || this.bodies.map(() => new Vector3());
    
    for (let i = 0; i < n; i++) {
      acc[i].set(0, 0, 0);
      
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        
        const r = new Vector3()
          .subVectors(positions[j], positions[i]);
        const rMag = r.length();
        
        if (rMag > EPSILON) {
          const forceMag = G * this.bodies[j].mass * this.bodies[i].mass / (rMag * rMag * rMag);
          r.normalize();
          acc[i].add(r.multiplyScalar(forceMag / this.bodies[i].mass));
        }
      }
    }
    
    return acc;
  }

  updateDisplayRadius(body) {
    // Ajustement dynamique du rayon d'affichage pour performance
    const distToCamera = body.mesh.position.distanceTo(body.cameraPosition || body.mesh.position);
    const scale = Math.max(0.1, Math.min(2.0, 1000 / distToCamera));
    body.mesh.scale.setScalar(scale);
  }

  // Conditions initiales réalistes Terre-Lune-Mars
  static createSolarSystem() {
    const AU = 1.496e11; // Unité astronomique
    
    return [
      {
        name: 'Sun',
        mass: 1.989e30,
        position: new Vector3(0, 0, 0),
        velocity: new Vector3(0, 0, 0),
        radius: 696340000,
        angularVelocity: 0.00001,
        color: 0xffff00
      },
      {
        name: 'Earth',
        mass: 5.972e24,
        position: new Vector3(1 * AU, 0, 0),
        velocity: new Vector3(0, 29780, 0),
        radius: 6371000,
        angularVelocity: 0.001,
        color: 0x4477aa
      },
      {
        name: 'Moon',
        mass: 7.342e22,
        position: new Vector3(1.00257 * AU, 0, 0),
        velocity: new Vector3(0, 29780 + 1022, 0),
        radius: 1737400,
        angularVelocity: 0.002,
        color: 0xaaaaaa
      },
      {
        name: 'Mars',
        mass: 6.39e23,
        position: new Vector3(1.524 * AU, 0, 0),
        velocity: new Vector3(0, 24130, 0),
        radius: 3389500,
        angularVelocity: 0.0012,
        color: 0xcd5c5c
      }
    ];
  }

  getBodyByName(name) {
    return this.bodies.find(body => body.name === name);
  }

  // État pour export CSV
  getStateSnapshot() {
    return this.bodies.map(body => ({
      name: body.name,
      position: body.position.clone(),
      velocity: body.velocity.clone(),
      time: performance.now() / 1000
    }));
  }

  // Reset à conditions initiales
  reset() {
    const initialState = PhysicsEngine.createSolarSystem();
    for (let i = 0; i < this.bodies.length; i++) {
      this.bodies[i].position.copy(initialState[i].position);
      this.bodies[i].velocity.copy(initialState[i].velocity);
    }
  }
}

// Export utilitaire pour tests
export function computeKeplerOrbit(a, e, t, mu = G * 1.989e30) {
  // Orbite képlérienne 2D simplifiée pour validation
  const M = Math.sqrt(mu / (a ** 3)) * t;
  const E = M; // Approximation pour petits excentricités
  const theta = 2 * Math.atan(Math.sqrt((1 + e)/(1 - e)) * Math.tan(E/2));
  const r = a * (1 - e * e) / (1 + e * Math.cos(theta));
  
  return { r, theta };
}