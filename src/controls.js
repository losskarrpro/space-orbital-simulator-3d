import * as THREE from 'https://cdn.skypack.dev/three@0.158.0';
import { ui } from './ui.js';

export class Controls {
    constructor(camera, renderer, scene, bodies) {
        this.camera = camera;
        this.renderer = renderer;
        this.scene = scene;
        this.bodies = bodies;
        
        this.keys = {};
        this.mouse = { x: 0, y: 0, down: false };
        this.target = new THREE.Vector3(0, 0, 0);
        this.zoom = 1.0;
        this.speed = 1.0;
        this.followBody = null;
        this.followOffset = new THREE.Vector3(0, 5, 15);
        
        this.init();
    }
    
    init() {
        // Keyboard
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse
        renderer.domElement.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            
            if (this.mouse.down) {
                const deltaX = e.movementX || 0;
                const deltaY = e.movementY || 0;
                this.rotateCamera(deltaX * 0.005, deltaY * 0.005);
            }
        });
        
        renderer.domElement.addEventListener('mousedown', (e) => {
            this.mouse.down = true;
        });
        
        document.addEventListener('mouseup', () => {
            this.mouse.down = false;
        });
        
        renderer.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.zoom *= e.deltaY > 0 ? 1.1 : 0.9;
            this.zoom = Math.max(0.1, Math.min(10, this.zoom));
            ui.updateZoom(this.zoom);
        });
        
        // Click to select body
        renderer.domElement.addEventListener('click', (e) => {
            const rect = renderer.domElement.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
            
            const intersects = raycaster.intersectObjects(
                this.bodies.map(body => body.mesh)
            );
            
            if (intersects.length > 0) {
                const selectedBody = this.bodies.find(b => 
                    b.mesh === intersects[0].object
                );
                this.setFollow(selectedBody);
            }
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        });
    }
    
    setFollow(body) {
        this.followBody = body;
        ui.setFollowBody(body ? body.name : 'Free');
    }
    
    rotateCamera(deltaX, deltaY) {
        const spherical = new THREE.Spherical();
        this.camera.getWorldPosition(new THREE.Vector3());
        
        spherical.setFromVector3(this.camera.position.clone().sub(this.target));
        spherical.theta -= deltaX;
        spherical.phi += deltaY;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
        
        const newPos = new THREE.Vector3()
            .setFromSpherical(spherical)
            .add(this.target);
            
        this.camera.lookAt(this.target);
        this.camera.position.lerp(newPos, 0.1);
    }
    
    update(deltaTime) {
        const moveSpeed = this.speed * 50 * deltaTime;
        const actualZoom = 10 / this.zoom;
        
        // Update target if following
        if (this.followBody) {
            this.target.copy(this.followBody.position);
            this.target.add(this.followOffset.clone().applyQuaternion(this.camera.quaternion));
        }
        
        // WASD movement
        const direction = new THREE.Vector3();
        if (this.keys['KeyW']) direction.z -= 1;
        if (this.keys['KeyS']) direction.z += 1;
        if (this.keys['KeyA']) direction.x -= 1;
        if (this.keys['KeyD']) direction.x += 1;
        if (this.keys['KeyQ']) direction.y -= 1;
        if (this.keys['KeyE']) direction.y += 1;
        
        if (direction.length() > 0) {
            direction.normalize();
            direction.applyQuaternion(this.camera.quaternion);
            this.target.add(direction.multiplyScalar(moveSpeed));
        }
        
        // Camera follows target smoothly
        const idealPosition = this.target.clone()
            .add(new THREE.Vector3(0, actualZoom * 0.5, actualZoom));
        
        this.camera.position.lerp(idealPosition, 0.05);
        this.camera.lookAt(this.target);
        
        // Update UI
        ui.updateSpeed(this.speed);
        ui.updateZoom(this.zoom);
    }
    
    setSpeed(value) {
        this.speed = value;
    }
    
    setZoom(value) {
        this.zoom = value;
    }
    
    getState() {
        return {
            target: this.target.clone(),
            zoom: this.zoom,
            speed: this.speed,
            followBody: this.followBody?.name || null
        };
    }
    
    setState(state) {
        if (state.target) this.target.copy(state.target);
        if (state.zoom !== undefined) this.zoom = state.zoom;
        if (state.speed !== undefined) this.speed = state.speed;
        if (state.followBody) {
            this.followBody = this.bodies.find(b => b.name === state.followBody);
        }
    }
}