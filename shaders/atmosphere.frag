precision highp float;

uniform float time;
uniform vec3 cameraPosition;
uniform vec3 planetCenter;
uniform float planetRadius;
uniform float atmosphereRadius;
uniform vec3 planetColor;
uniform vec3 lightDirection;
uniform float lightIntensity;
uniform float rayleighScattering;
uniform float mieScattering;
uniform float mieAnisotropy;
uniform float exposure;

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vRayDir;

const int STEP_COUNT = 16;
const float STEP_SIZE = 0.02;
const float PI = 3.14159265359;
const float PI2 = 6.28318530718;

// Rayleigh phase function
float rayleighPhase(float cosTheta) {
    return (3.0 / (16.0 * PI)) * (1.0 + cosTheta * cosTheta);
}

// Mie phase function (Henyey-Greenstein)
float hgPhase(float cosTheta, float g) {
    float g2 = g * g;
    return (1.0 / (4.0 * PI)) * ((1.0 - g2) / pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5));
}

// Atmosphere density
float atmosphereDensity(float height) {
    float density = exp(-height * 0.15);
    return density * density * density * density;
}

// Optical depth calculation
vec3 calculateOpticalDepth(vec3 rayOrigin, vec3 rayDir, float rayLength) {
    vec3 opticalDepth = vec3(0.0);
    float stepLength = rayLength / float(STEP_COUNT);
    
    for (int i = 0; i < STEP_COUNT; i++) {
        float sampleDistance = stepLength * (float(i) + 0.5);
        vec3 samplePos = rayOrigin + rayDir * sampleDistance;
        float height = length(samplePos - planetCenter) - planetRadius;
        
        float density = atmosphereDensity(height);
        opticalDepth += vec3(rayleighScattering, mieScattering * 0.8, mieScattering * 0.4) * density * stepLength;
    }
    
    return opticalDepth;
}

// Light scattering calculation
vec3 calculateScattering(vec3 rayOrigin, vec3 rayDir, vec3 lightDir) {
    vec3 totalScattering = vec3(0.0);
    float stepLength = STEP_SIZE * atmosphereRadius;
    
    for (int i = 0; i < STEP_COUNT; i++) {
        float sampleDistance = stepLength * (float(i) + 0.5);
        vec3 samplePos = rayOrigin + rayDir * sampleDistance;
        
        float height = length(samplePos - planetCenter) - planetRadius;
        if (height < 0.0) break;
        
        float density = atmosphereDensity(height);
        
        // Optical depth to camera
        vec3 rayToCamera = normalize(cameraPosition - samplePos);
        float distanceToCamera = length(cameraPosition - samplePos);
        vec3 opticalDepthToCamera = calculateOpticalDepth(samplePos, rayToCamera, distanceToCamera);
        
        // Optical depth to light
        vec3 opticalDepthToLight = calculateOpticalDepth(samplePos, lightDir, atmosphereRadius * 0.5);
        
        vec3 transmittance = exp(-(opticalDepthToCamera + opticalDepthToLight));
        
        float cosTheta = dot(rayDir, lightDir);
        float rayleighPhaseValue = rayleighPhase(cosTheta);
        float miePhaseValue = hgPhase(cosTheta, mieAnisotropy);
        
        vec3 scattering = planetColor * rayleighPhaseValue * rayleighScattering +
                         vec3(1.0, 0.9, 0.7) * miePhaseValue * mieScattering * 0.5;
        
        totalScattering += scattering * transmittance * density * stepLength;
    }
    
    return totalScattering * lightIntensity;
}

void main() {
    vec3 rayDir = normalize(vWorldPosition - cameraPosition);
    vec3 rayOrigin = vWorldPosition;
    
    // Calculate intersection with atmosphere
    float height = length(rayOrigin - planetCenter) - planetRadius;
    
    // Fresnel effect
    float fresnel = pow(1.0 - dot(normalize(vNormal), normalize(cameraPosition - vWorldPosition)), 2.0);
    
    // Base atmosphere color
    vec3 atmColor = planetColor * 0.3 + vec3(0.4, 0.6, 1.0) * 0.7;
    
    // Scattering
    vec3 scattering = calculateScattering(rayOrigin, rayDir, lightDirection);
    
    // Combine
    vec3 finalColor = mix(atmColor, scattering, 0.8);
    finalColor += fresnel * vec3(0.8, 0.9, 1.0);
    
    // Exposure
    finalColor = 1.0 - exp(-finalColor * exposure);
    
    // Gamma correction
    finalColor = pow(finalColor, vec3(0.4545));
    
    gl_FragColor = vec4(finalColor, 1.0);
}