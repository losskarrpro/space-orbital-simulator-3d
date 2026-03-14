import * as THREE from 'three';
import { initPhysics } from './physics.js';
import { createCelestialBodies } from './bodies.js';
import { initControls } from './controls.js';
import { initShaders } from './shaders.js';
import { initUI } from './ui.js';
import { initExport } from './export.js';
import { loadTextures } from './textures.js';

let scene, camera, renderer, clock;
let bodies = [];
let physicsEngine;
let controls;

async function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0001);

    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1e12);
    camera.position.set(0, 5e8, 2e9);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    document.body.appendChild(renderer.domElement);

    // Clock for delta time
    clock = new THREE.Clock();

    // Load textures
    const textures = await loadTextures();

    // Initialize shaders
    initShaders();

    // Initialize physics engine
    physicsEngine = initPhysics(bodies);

    // Create celestial bodies
    bodies = createCelestialBodies(scene, textures, physicsEngine);

    // Initialize controls
    controls = initControls(camera, renderer.domElement);

    // Initialize UI
    initUI(bodies, physicsEngine, camera);

    // Initialize export functionality
    initExport(bodies);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);

    // Starfield
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 50000;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
        starPositions[i] = (Math.random() - 0.5) * 4e12;
        starPositions[i + 1] = (Math.random() - 0.5) * 4e12;
        starPositions[i + 2] = (Math.random() - 0.5) * 4e12;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    animate();
}

function animate() {
    requestAnimationFrame(animate);

    const deltaTime = Math.min(clock.getDelta(), 0.1);
    
    // Update physics
    physicsEngine.update(deltaTime);

    // Update controls
    if (controls) {
        controls.update(deltaTime);
    }

    // Update body rotations and positions
    bodies.forEach(body => {
        if (body.userData.mesh) {
            body.userData.mesh.rotation.y += body.userData.rotationSpeed * deltaTime;
        }
    });

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize);

// Global access for other modules
window.spaceSim = {
    scene,
    camera,
    renderer,
    bodies,
    physicsEngine,
    controls
};

init().catch(console.error);