// src/shaders.js - Shaders atmosphère et matériaux planétaires HDR

export const atmosphereVertexShader = `
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vViewPosition = -(modelViewMatrix * vec4(position, 1.0)).xyz;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const atmosphereFragmentShader = `
  uniform float uAtmosphereHeight;
  uniform vec3 uSunDirection;
  uniform float uTime;
  uniform float uAtmosphereIntensity;
  
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  
  vec3 atmosphereColor(vec3 rayDir, vec3 sunDir) {
    float sunDot = clamp(dot(rayDir, sunDir), 0.0, 1.0);
    
    // Ciel bleu Rayleigh
    float rayleigh = sunDot * sunDot * sunDot * 0.6;
    
    // Mie scattering (nuages)
    float mie = sunDot * sunDot * 0.5;
    
    return vec3(0.3, 0.6, 1.0) * rayleigh + vec3(1.0, 0.9, 0.8) * mie;
  }
  
  void main() {
    vec3 rayDir = normalize(vViewPosition);
    vec3 normal = normalize(vNormal);
    
    float heightFactor = clamp((length(vWorldPosition) - 1.0) / uAtmosphereHeight, 0.0, 1.0);
    
    vec3 atmColor = atmosphereColor(rayDir, uSunDirection);
    float fresnel = pow(1.0 - dot(normal, rayDir), 2.0);
    
    gl_FragColor = vec4(atmColor * heightFactor * uAtmosphereIntensity * fresnel, heightFactor * 0.8);
  }
`;

export const earthDayMaterial = {
  uniforms: {
    dayTexture: { value: null },
    nightTexture: { value: null },
    specularTexture: { value: null },
    cloudsTexture: { value: null },
    sunDirection: { value: new THREE.Vector3(1.0, 0.0, 0.3) },
    time: { value: 0.0 }
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      vViewPosition = -(modelViewMatrix * vec4(position, 1.0)).xyz;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D dayTexture;
    uniform sampler2D nightTexture;
    uniform sampler2D specularTexture;
    uniform sampler2D cloudsTexture;
    uniform vec3 sunDirection;
    uniform float time;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;
    
    void main() {
      vec3 dayColor = texture2D(dayTexture, vUv).rgb;
      vec3 nightColor = texture2D(nightTexture, vUv).rgb;
      vec3 specular = texture2D(specularTexture, vUv).rgb;
      vec3 clouds = texture2D(cloudsTexture, vUv).rgb;
      
      float cosAngle = clamp(dot(normalize(vNormal), sunDirection), 0.0, 1.0);
      float nightFactor = 1.0 - cosAngle;
      
      vec3 color = mix(dayColor, nightColor, nightFactor);
      
      // Océans et specular
      float specularFactor = specular.r * pow(cosAngle, 32.0);
      color = mix(color, vec3(0.1, 0.2, 0.4), specularFactor * 0.5);
      
      // Nuages
      float cloudFactor = clouds.r * (0.5 + 0.5 * cosAngle);
      color = mix(color, vec3(1.0), cloudFactor * 0.3);
      
      // Éclairage ambiant
      color *= 0.6 + 0.4 * cosAngle;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
};

export const moonMaterial = {
  uniforms: {
    moonTexture: { value: null },
    sunDirection: { value: new THREE.Vector3(1.0, 0.0, 0.3) }
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D moonTexture;
    uniform vec3 sunDirection;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    
    void main() {
      vec3 moonColor = texture2D(moonTexture, vUv).rgb;
      
      float cosAngle = clamp(dot(vNormal, sunDirection), 0.0, 1.0);
      float lighting = 0.3 + 0.7 * cosAngle;
      
      gl_FragColor = vec4(moonColor * lighting, 1.0);
    }
  `
};

export const marsMaterial = {
  uniforms: {
    marsTexture: { value: null },
    sunDirection: { value: new THREE.Vector3(1.0, 0.0, 0.3) }
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D marsTexture;
    uniform vec3 sunDirection;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    
    void main() {
      vec3 marsColor = texture2D(marsTexture, vUv).rgb;
      
      float cosAngle = clamp(dot(vNormal, sunDirection), 0.0, 1.0);
      float lighting = 0.4 + 0.6 * cosAngle;
      
      // Atmosphère martienne subtile
      float atmFactor = pow(1.0 - cosAngle, 2.0) * 0.3;
      vec3 atmColor = vec3(1.0, 0.6, 0.4) * atmFactor;
      
      gl_FragColor = vec4(mix(marsColor * lighting, atmColor, 0.2), 1.0);
    }
  `
};

export const starsMaterial = {
  uniforms: {
    starsTexture: { value: null }
  },
  vertexShader: `
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D starsTexture;
    
    varying vec2 vUv;
    
    void main() {
      vec4 stars = texture2D(starsTexture, vUv);
      gl_FragColor = stars;
    }
  `
};

// Fonction utilitaire pour créer les matériaux
export function createPlanetMaterials(textures) {
  const earthMat = new THREE.ShaderMaterial({
    ...earthDayMaterial,
    uniforms: {
      ...earthDayMaterial.uniforms,
      dayTexture: { value: textures.earthDay },
      nightTexture: { value: textures.earthNight },
      specularTexture: { value: textures.earthSpecular },
      cloudsTexture: { value: textures.earthClouds }
    }
  });

  const moonMat = new THREE.ShaderMaterial({
    ...moonMaterial,
    uniforms: {
      ...moonMaterial.uniforms,
      moonTexture: { value: textures.moon }
    }
  });

  const marsMat = new THREE.ShaderMaterial({
    ...marsMaterial,
    uniforms: {
      ...marsMaterial.uniforms,
      marsTexture: { value: textures.mars }
    }
  });

  const starsMat = new THREE.ShaderMaterial({
    ...starsMaterial,
    uniforms: {
      ...starsMaterial.uniforms,
      starsTexture: { value: textures.stars }
    },
    side: THREE.BackSide
  });

  const atmosphereMat = new THREE.ShaderMaterial({
    uniforms: {
      uAtmosphereHeight: { value: 1.025 },
      uSunDirection: { value: new THREE.Vector3(1.0, 0.0, 0.3) },
      uTime: { value: 0.0 },
      uAtmosphereIntensity: { value: 1.0 }
    },
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending
  });

  return {
    earth: earthMat,
    moon: moonMat,
    mars: marsMat,
    stars: starsMat,
    atmosphere: atmosphereMat
  };
}