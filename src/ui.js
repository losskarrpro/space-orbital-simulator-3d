import * as THREE from 'three';
import { scene, camera, renderer, bodies, simulationSpeed, timeScale, isPlaying } from './main.js';
import { resetSimulation } from './physics.js';
import { exportPositions } from './export.js';

let uiContainer;
let playPauseBtn, resetBtn, exportBtn;
let speedSlider, zoomSlider, timeScaleSlider;
let speedValue, zoomValue, timeScaleValue;

export function initUI() {
    uiContainer = document.createElement('div');
    uiContainer.id = 'ui-container';
    uiContainer.style.cssText = `
        position: absolute;
        top: 20px;
        left: 20px;
        background: rgba(0, 20, 40, 0.9);
        padding: 20px;
        border-radius: 12px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        font-family: 'Segoe UI', sans-serif;
        color: white;
        min-width: 250px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        z-index: 1000;
    `;
    document.body.appendChild(uiContainer);

    createControls();
    createSliders();
    updateUI();
}

function createControls() {
    // Play/Pause button
    playPauseBtn = document.createElement('button');
    playPauseBtn.textContent = '⏸️ Pause';
    playPauseBtn.style.cssText = `
        width: 100%;
        padding: 12px;
        margin: 8px 0;
        background: linear-gradient(145deg, #4a90e2, #357abd);
        border: none;
        border-radius: 8px;
        color: white;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(74, 144, 226, 0.4);
    `;
    playPauseBtn.addEventListener('click', togglePlayPause);
    playPauseBtn.addEventListener('mouseenter', (e) => e.target.style.transform = 'translateY(-2px)');
    playPauseBtn.addEventListener('mouseleave', (e) => e.target.style.transform = 'translateY(0)');
    uiContainer.appendChild(playPauseBtn);

    // Reset button
    resetBtn = document.createElement('button');
    resetBtn.textContent = '🔄 Reset';
    resetBtn.style.cssText = `
        width: 100%;
        padding: 12px;
        margin: 8px 0;
        background: linear-gradient(145deg, #ff6b6b, #ee5a52);
        border: none;
        border-radius: 8px;
        color: white;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
    `;
    resetBtn.addEventListener('click', resetSimulation);
    resetBtn.addEventListener('mouseenter', (e) => e.target.style.transform = 'translateY(-2px)');
    resetBtn.addEventListener('mouseleave', (e) => e.target.style.transform = 'translateY(0)');
    uiContainer.appendChild(resetBtn);

    // Export button
    exportBtn = document.createElement('button');
    exportBtn.textContent = '📊 Export CSV';
    exportBtn.style.cssText = `
        width: 100%;
        padding: 12px;
        margin: 8px 0;
        background: linear-gradient(145deg, #51cf66, #40c057);
        border: none;
        border-radius: 8px;
        color: white;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(81, 207, 102, 0.4);
    `;
    exportBtn.addEventListener('click', exportPositions);
    exportBtn.addEventListener('mouseenter', (e) => e.target.style.transform = 'translateY(-2px)');
    exportBtn.addEventListener('mouseleave', (e) => e.target.style.transform = 'translateY(0)');
    uiContainer.appendChild(exportBtn);
}

function createSliders() {
    // Simulation Speed Slider
    const speedLabel = document.createElement('div');
    speedLabel.textContent = 'Vitesse Simulation:';
    speedLabel.style.cssText = 'margin: 15px 0 5px 0; font-weight: 600; font-size: 14px; color: #a0d2ff;';
    uiContainer.appendChild(speedLabel);

    speedSlider = document.createElement('input');
    speedSlider.type = 'range';
    speedSlider.min = 0.1;
    speedSlider.max = 5;
    speedSlider.step = 0.1;
    speedSlider.value = simulationSpeed.toString();
    speedSlider.style.cssText = 'width: 100%; height: 6px; -webkit-appearance: none; background: rgba(255,255,255,0.2); border-radius: 3px; outline: none;';
    speedSlider.addEventListener('input', (e) => {
        simulationSpeed.value = parseFloat(e.target.value);
        speedValue.textContent = `x${simulationSpeed.value.toFixed(1)}`;
    });
    uiContainer.appendChild(speedSlider);

    speedValue = document.createElement('div');
    speedValue.textContent = `x${simulationSpeed.value.toFixed(1)}`;
    speedValue.style.cssText = 'text-align: right; font-size: 12px; color: #88ccff; margin-top: 2px;';
    uiContainer.appendChild(speedValue);

    // Camera Zoom Slider
    const zoomLabel = document.createElement('div');
    zoomLabel.textContent = 'Zoom Caméra:';
    zoomLabel.style.cssText = 'margin: 15px 0 5px 0; font-weight: 600; font-size: 14px; color: #a0d2ff;';
    uiContainer.appendChild(zoomLabel);

    zoomSlider = document.createElement('input');
    zoomSlider.type = 'range';
    zoomSlider.min = 0.5;
    zoomSlider.max = 10;
    zoomSlider.step = 0.1;
    zoomSlider.value = '2';
    zoomSlider.style.cssText = 'width: 100%; height: 6px; -webkit-appearance: none; background: rgba(255,255,255,0.2); border-radius: 3px; outline: none;';
    zoomSlider.addEventListener('input', (e) => {
        const zoom = parseFloat(e.target.value);
        camera.position.multiplyScalar(zoom / parseFloat(zoomSlider.value));
        zoomValue.textContent = `${zoom.toFixed(1)}x`;
    });
    uiContainer.appendChild(zoomSlider);

    zoomValue = document.createElement('div');
    zoomValue.textContent = '2.0x';
    zoomValue.style.cssText = 'text-align: right; font-size: 12px; color: #88ccff; margin-top: 2px;';
    uiContainer.appendChild(zoomValue);

    // Time Scale Slider
    const timeLabel = document.createElement('div');
    timeLabel.textContent = 'Échelle Temps:';
    timeLabel.style.cssText = 'margin: 15px 0 5px 0; font-weight: 600; font-size: 14px; color: #a0d2ff;';
    uiContainer.appendChild(timeLabel);

    timeScaleSlider = document.createElement('input');
    timeScaleSlider.type = 'range';
    timeScaleSlider.min = 0.01;
    timeScaleSlider.max = 100;
    timeScaleSlider.step = 0.01;
    timeScaleSlider.value = timeScale.value.toString();
    timeScaleSlider.style.cssText = 'width: 100%; height: 6px; -webkit-appearance: none; background: rgba(255,255,255,0.2); border-radius: 3px; outline: none;';
    timeScaleSlider.addEventListener('input', (e) => {
        timeScale.value = parseFloat(e.target.value);
        timeScaleValue.textContent = `${timeScale.value.toFixed(2)} jours/s`;
    });
    uiContainer.appendChild(timeScaleSlider);

    timeScaleValue = document.createElement('div');
    timeScaleValue.textContent = `${timeScale.value.toFixed(2)} jours/s`;
    timeScaleValue.style.cssText = 'text-align: right; font-size: 12px; color: #88ccff; margin-top: 2px;';
    uiContainer.appendChild(timeScaleValue);

    // Custom slider thumb styling
    const style = document.createElement('style');
    style.textContent = `
        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            background: linear-gradient(145deg, #ffffff, #e0e0e0);
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 2px solid rgba(255,255,255,0.8);
        }
        input[type="range"]::-moz-range-thumb {
            width: 20px;
            height: 20px;
            background: linear-gradient(145deg, #ffffff, #e0e0e0);
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 2px solid rgba(255,255,255,0.8);
            border-width: 0;
        }
    `;
    document.head.appendChild(style);
}

export function togglePlayPause() {
    isPlaying.value = !isPlaying.value;
    playPauseBtn.textContent = isPlaying.value ? '⏸️ Pause' : '▶️ Play';
    playPauseBtn.style.background = isPlaying.value 
        ? 'linear-gradient(145deg, #4a90e2, #357abd)' 
        : 'linear-gradient(145deg, #6c757d, #5a6268)';
}

export function updateUI() {
    if (speedSlider) speedSlider.value = simulationSpeed.value.toFixed(1);
    if (speedValue) speedValue.textContent = `x${simulationSpeed.value.toFixed(1)}`;
    if (timeScaleSlider) timeScaleSlider.value = timeScale.value;
    if (timeScaleValue) timeScaleValue.textContent = `${timeScale.value.toFixed(2)} jours/s`;
    if (playPauseBtn) {
        playPauseBtn.textContent = isPlaying.value ? '⏸️ Pause' : '▶️ Play';
    }
}

export function resizeUI() {
    // UI responsive adjustments
    if (window.innerWidth < 768) {
        uiContainer.style.left = '10px';
        uiContainer.style.top = '10px';
        uiContainer.style.padding = '15px';
        uiContainer.style.minWidth = '220px';
    }
}