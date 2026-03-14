import * as THREE from 'three';
import { PhysicsBody } from './physics.js';
import { earthDayTexture, earthNightTexture, earthCloudsTexture, earthSpecularTexture, moonTexture, marsTexture, starsTexture } from './textures.js';

export class CelestialBodies {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;
        this.bodies = [];
        this.trails = [];
        this.timeScale = 1.0;
        this.initBodies();
        this.initStars();
        this.initTrails();
    }

    initStars() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsVertices = [];
        for (let i = 0; i < 20000; i++) {
            starsVertices.push(
                (Math.random() - 0.5) * 4000,
                (Math.random() - 0.5) * 4000,
                (Math.random() - 0.5) * 4000
            );
        }
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        const starsMaterial = new THREE.PointsMaterial({ 
            color: 0xffffff, 
            size: 2,
            sizeAttenuation: false,
            transparent: true,
            opacity: 0.8
        });
        this.stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(this.stars);
    }

    initBodies() {
        // Soleil (fixe au centre)
        this.sun = this.createSun();
        this.scene.add(this.sun);

        // Terre
        this.earth = this.createEarth();
        this.earth.physicsBody = new PhysicsBody(
            this.earth,
            5.972e24, // masse réelle Terre
            new THREE.Vector3(1.496e11, 0, 0), // distance AU
            new THREE.Vector3(0, 0, 29780), // vitesse orbitale
            new THREE.Vector3(0, 0, 0),
            0x4a90e2
        );
        this.physics.addBody(this.earth.physicsBody);
        this.scene.add(this.earth);

        // Lune
        this.moon = this.createMoon();
        const moonDistance = 3.844e8;
        const moonOrbitalSpeed = 1022;
        this.moon.physicsBody = new PhysicsBody(
            this.moon,
            7.342e22, // masse Lune
            new THREE.Vector3(1.496e11 + moonDistance, 0, 0),
            new THREE.Vector3(0, 0, moonOrbitalSpeed),
            new THREE.Vector3(0, 0, 0),
            0xaaaaaa
        );
        this.physics.addBody(this.moon.physicsBody);
        this.scene.add(this.moon);

        // Mars
        this.mars = this.createMars();
        this.mars.physicsBody = new PhysicsBody(
            this.mars,
            6.39e23, // masse Mars
            new THREE.Vector3(2.279e11, 0, 0), // distance moyenne
            new THREE.Vector3(0, 0, 24130), // vitesse orbitale
            new THREE.Vector3(0, 0, 0),
            0xcd5c44
        );
        this.physics.addBody(this.mars.physicsBody);
        this.scene.add(this.mars);

        this.bodies = [this.earth, this.moon, this.mars];
    }

    createSun() {
        const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffdd00,
            emissive: 0x444400
        });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        sun.position.set(0, 0, 0);
        return sun;
    }

    createEarth() {
        const earthGroup = new THREE.Group();

        // Planète principale
        const earthGeometry = new THREE.SphereGeometry(6.371e6 * 0.0001, 64, 64);
        const earthMaterial = new THREE.MeshPhongMaterial({
            map: earthDayTexture,
            emissiveMap: earthNightTexture,
            emissive: 0x222222,
            shininess: 100
        });
        const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
        earthGroup.add(earthMesh);

        // Nuages
        const cloudsGeometry = new THREE.SphereGeometry(6.371e6 * 0.000105, 64, 64);
        const cloudsMaterial = new THREE.MeshPhongMaterial({
            map: earthCloudsTexture,
            transparent: true,
            opacity: 0.4
        });
        const cloudsMesh = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
        earthGroup.add(cloudsMesh);

        // Atmosphère (glowing)
        const atmosphereGeometry = new THREE.SphereGeometry(6.371e6 * 0.00012, 64, 64);
        const atmosphereMaterial = new THREE.ShaderMaterial({
            uniforms: {
                c: { value: 0.3 },
                p: { value: 2.0 },
                glowColor: { value: new THREE.Color(0x4a90e2) },
                viewVector: { value: new THREE.Vector3() }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vNormal = normalize(normalMatrix * normal);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                uniform float c;
                uniform float p;
                varying vec3 vNormal;
                varying vec3 vWorldPosition;
                void main() {
                    vec3 worldPosition = normalize(vWorldPosition);
                    float intensity = pow(c - dot(worldPosition, vNormal), p);
                    gl_FragColor = vec4(glowColor, intensity);
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        earthGroup.add(atmosphereMesh);

        // Rotation automatique
        earthGroup.userData.rotationSpeed = 0.01;
        return earthGroup;
    }

    createMoon() {
        const moonGeometry = new THREE.SphereGeometry(1.737e6 * 0.0001, 32, 32);
        const moonMaterial = new THREE.MeshPhongMaterial({
            map: moonTexture,
            shininess: 0
        });
        const moon = new THREE.Mesh(moonGeometry, moonMaterial);
        moon.userData.rotationSpeed = 0.005;
        return moon;
    }

    createMars() {
        const marsGeometry = new THREE.SphereGeometry(3.39e6 * 0.0001, 64, 64);
        const marsMaterial = new THREE.MeshPhongMaterial({
            map: marsTexture,
            shininess: 10
        });
        const mars = new THREE.Mesh(marsGeometry, marsMaterial);
        mars.userData.rotationSpeed = 0.008;
        return mars;
    }

    initTrails() {
        this.bodies.forEach(body => {
            const trailGeometry = new THREE.BufferGeometry();
            const trailMaterial = new THREE.LineBasicMaterial({
                color: body.physicsBody.color,
                transparent: true,
                opacity: 0.6,
                linewidth: 2
            });
            const trail = new THREE.Line(trailGeometry, trailMaterial);
            trail.userData.positions = [];
            trail.userData.maxPoints = 1000;
            this.scene.add(trail);
            this.trails.push(trail);
        });
    }

    update(deltaTime) {
        // Mise à jour physique
        this.physics.update(deltaTime * this.timeScale);

        // Rotation des corps
        this.earth.rotation.y += this.earth.userData.rotationSpeed * deltaTime * this.timeScale;
        this.moon.rotation.y += this.moon.userData.rotationSpeed * deltaTime * this.timeScale;
        this.mars.rotation.y += this.mars.userData.rotationSpeed * deltaTime * this.timeScale;

        // Mise à jour des trails
        this.updateTrails(deltaTime);

        // Rotation des étoiles
        this.stars.rotation.y += 0.0005 * deltaTime;
    }

    updateTrails(deltaTime) {
        this.bodies.forEach((body, index) => {
            const trail = this.trails[index];
            const positions = trail.userData.positions;
            
            positions.push(body.physicsBody.position.clone());
            
            if (positions.length > trail.userData.maxPoints) {
                positions.shift();
            }

            const trailPositions = new Float32Array(positions.length * 3);
            positions.forEach((pos, i) => {
                trailPositions[i * 3] = pos.x;
                trailPositions[i * 3 + 1] = pos.y;
                trailPositions[i * 3 + 2] = pos.z;
            });

            trail.geometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
            trail.geometry.attributes.position.needsUpdate = true;
        });
    }

    setTimeScale(scale) {
        this.timeScale = scale;
    }

    toggleTrails() {
        this.trails.forEach(trail => {
            trail.visible = !trail.visible;
        });
    }

    getBodyPositions() {
        return this.bodies.map(body => ({
            name: body.name || body.type,
            position: body.physicsBody.position.clone(),
            velocity: body.physicsBody.velocity.clone()
        }));
    }

    reset() {
        this.physics.reset();
        this.trails.forEach(trail => {
            trail.userData.positions = [];
            trail.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3));
        });
    }
}