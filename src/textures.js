// src/textures.js - Chargement textures planètes depuis CDN fiables

import * as THREE from 'three';

const TEXTURE_CACHE = new Map();

export class TextureManager {
    constructor(renderer) {
        this.renderer = renderer;
        this.textureLoader = new THREE.TextureLoader();
        this.cubeTextureLoader = new THREE.CubeTextureLoader();
        
        // URLs CDN fiables avec fallback
        this.textureUrls = {
            earthDay: [
                'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
                'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_atmos_2048.jpg'
            ],
            earthNight: [
                'https://threejs.org/examples/textures/planets/earth_lights_2048.jpg',
                'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_lights_2048.jpg'
            ],
            earthClouds: [
                'https://threejs.org/examples/textures/planets/earth_clouds_2048.jpg',
                'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_clouds_2048.jpg'
            ],
            earthSpecular: [
                'https://threejs.org/examples/textures/planets/earth_specular_2048.jpg',
                'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_specular_2048.jpg'
            ],
            moon: [
                'https://threejs.org/examples/textures/planets/moon_1024.jpg',
                'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/moon_1024.jpg'
            ],
            mars: [
                'https://threejs.org/examples/textures/planets/mars_1024.jpg',
                'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/mars_1024.jpg'
            ],
            stars: [
                'https://threejs.org/examples/textures/sprites/disc.png',
                'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/sprites/disc.png'
            ]
        };

        // Fallback textures procédurales
        this.fallbacks = {
            earthDay: this.createEarthDayFallback(),
            earthNight: this.createEarthNightFallback(),
            earthClouds: this.createCloudsFallback(),
            earthSpecular: this.createSpecularFallback(),
            moon: this.createMoonFallback(),
            mars: this.createMarsFallback(),
            stars: this.createStarsFallback()
        };
    }

    async loadAllTextures() {
        const promises = Object.entries(this.textureUrls).map(async ([name, urls]) => {
            try {
                const texture = await this.loadTextureWithFallback(urls);
                TEXTURE_CACHE.set(name, texture);
                return { name, texture };
            } catch (error) {
                console.warn(`Failed to load ${name}:`, error);
                const fallback = this.fallbacks[name];
                TEXTURE_CACHE.set(name, fallback);
                return { name, texture: fallback };
            }
        });

        return Promise.all(promises);
    }

    loadTextureWithFallback(urls) {
        return new Promise((resolve, reject) => {
            let attempted = 0;
            const tryUrl = (index = 0) => {
                if (index >= urls.length) {
                    reject(new Error('All texture URLs failed'));
                    return;
                }

                const url = urls[index];
                this.textureLoader.load(
                    url,
                    (texture) => {
                        texture.encoding = THREE.sRGBEncoding;
                        texture.anisotropy = 16;
                        texture.wrapS = THREE.RepeatWrapping;
                        texture.wrapT = THREE.RepeatWrapping;
                        resolve(texture);
                    },
                    undefined,
                    (error) => {
                        console.warn(`Failed to load ${url}:`, error);
                        attempted++;
                        tryUrl(index + 1);
                    }
                );
            };
            tryUrl(0);
        });
    }

    getTexture(name) {
        return TEXTURE_CACHE.get(name) || this.fallbacks[name];
    }

    async loadStarsEnvironment() {
        try {
            const urls = [
                'https://threejs.org/examples/textures/cube/skybox/px.jpg',
                'https://threejs.org/examples/textures/cube/skybox/nx.jpg',
                'https://threejs.org/examples/textures/cube/skybox/py.jpg',
                'https://threejs.org/examples/textures/cube/skybox/ny.jpg',
                'https://threejs.org/examples/textures/cube/skybox/pz.jpg',
                'https://threejs.org/examples/textures/cube/skybox/nz.jpg'
            ];
            const cubeTexture = await new Promise((resolve, reject) => {
                this.cubeTextureLoader.load(urls, resolve, undefined, reject);
            });
            cubeTexture.encoding = THREE.sRGBEncoding;
            return cubeTexture;
        } catch (error) {
            console.warn('Failed to load stars environment:', error);
            return null;
        }
    }

    // Fallback textures procédurales
    createEarthDayFallback() {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 512;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
        gradient.addColorStop(0, '#4a90e2');
        gradient.addColorStop(0.3, '#7bb3f0');
        gradient.addColorStop(0.6, '#90c8ff');
        gradient.addColorStop(1, '#5a9bd4');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    createEarthNightFallback() {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 512;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#001122';
        ctx.fillRect(0, 0, 512, 512);
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    createCloudsFallback() {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 512;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        for (let i = 0; i < 50; i++) {
            ctx.beginPath();
            ctx.arc(Math.random()*512, Math.random()*512, Math.random()*30+5, 0, Math.PI*2);
            ctx.fill();
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    createSpecularFallback() {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 512;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.7, '#444444');
        gradient.addColorStop(1, '#000000');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    createMoonFallback() {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 512;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
        gradient.addColorStop(0, '#d8d8d8');
        gradient.addColorStop(0.5, '#b8b8b8');
        gradient.addColorStop(1, '#888888');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    createMarsFallback() {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 512;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
        gradient.addColorStop(0, '#cd5c2f');
        gradient.addColorStop(0.5, '#b84c24');
        gradient.addColorStop(1, '#8b3a1e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    createStarsFallback() {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 512;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000011';
        ctx.fillRect(0, 0, 512, 512);
        for (let i = 0; i < 200; i++) {
            ctx.fillStyle = `rgba(255,255,255,${Math.random()})`;
            ctx.fillRect(Math.random()*512, Math.random()*512, 1, 1);
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    dispose() {
        TEXTURE_CACHE.forEach(texture => {
            if (texture.dispose) texture.dispose();
        });
        TEXTURE_CACHE.clear();
    }
}

export default TextureManager;