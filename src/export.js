// src/export.js - Export positions orbitales en CSV
export class OrbitalExporter {
  constructor(scene, bodies) {
    this.scene = scene;
    this.bodies = bodies;
    this.trailData = new Map();
    this.isRecording = false;
    this.startTime = 0;
  }

  startRecording(bodyNames = null) {
    this.isRecording = true;
    this.startTime = performance.now();
    
    // Initialiser les données de trajectoire pour les corps spécifiés
    if (bodyNames) {
      bodyNames.forEach(name => {
        this.trailData.set(name, []);
      });
    } else {
      // Enregistrer tous les corps par défaut
      this.bodies.forEach(body => {
        this.trailData.set(body.name, []);
      });
    }
  }

  stopRecording() {
    this.isRecording = false;
  }

  update() {
    if (!this.isRecording) return;

    const currentTime = performance.now() - this.startTime;
    
    this.trailData.forEach((positions, name) => {
      const body = this.bodies.find(b => b.name === name);
      if (body && body.mesh) {
        const pos = body.mesh.position.clone();
        positions.push({
          time: currentTime / 1000, // en secondes
          x: pos.x,
          y: pos.y,
          z: pos.z,
          vx: body.velocity.x,
          vy: body.velocity.y,
          vz: body.velocity.z
        });
      }
    });
  }

  exportCSV(filename = 'orbital_positions.csv') {
    if (this.trailData.size === 0) {
      console.warn('Aucune donnée à exporter. Lancez d\'abord l\'enregistrement.');
      return;
    }

    let csvContent = 'body,time,x,y,z,vx,vy,vz\n';

    this.trailData.forEach((positions, bodyName) => {
      positions.forEach(pos => {
        csvContent += `${bodyName},${pos.time.toFixed(3)},${pos.x.toFixed(6)},${pos.y.toFixed(6)},${pos.z.toFixed(6)},${pos.vx.toFixed(6)},${pos.vy.toFixed(6)},${pos.vz.toFixed(6)}\n`;
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  clearData() {
    this.trailData.clear();
    this.isRecording = false;
  }

  getStats() {
    let totalPoints = 0;
    this.trailData.forEach(positions => {
      totalPoints += positions.length;
    });
    return {
      isRecording: this.isRecording,
      totalPoints,
      bodiesRecorded: this.trailData.size,
      duration: this.isRecording ? (performance.now() - this.startTime) / 1000 : 0
    };
  }
}

// Fonction utilitaire pour créer un lien d'export depuis des données externes
export function createCSVFromData(data, filename = 'orbital_data.csv') {
  let csvContent = 'body,time,x,y,z,vx,vy,vz\n';
  
  data.forEach(item => {
    csvContent += `${item.body},${item.time.toFixed(3)},${item.x.toFixed(6)},${item.y.toFixed(6)},${item.z.toFixed(6)},${item.vx.toFixed(6)},${item.vy.toFixed(6)},${item.vz.toFixed(6)}\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export JSON pour analyse avancée
export function exportJSON(data, filename = 'orbital_data.json') {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}