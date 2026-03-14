#version 300 es
precision highp float;

in vec3 position;
in vec3 normal;
in vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;
uniform float planetRadius;
uniform float atmosphereHeight;
uniform float time;

out vec3 vPosition;
out vec3 vWorldPosition;
out vec3 vNormal;
out vec3 vViewDirection;
out vec3 vFragmentPosition;
out float vAtmosphereFactor;
out vec2 vUv;

#define PI 3.14159265359
#define TWO_PI 6.28318530718

vec3 rotateY(vec3 v, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec3(
        v.x * c + v.z * s,
        v.y,
        -v.x * s + v.z * c
    );
}

void main() {
    vUv = uv;
    
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    // Position de la planète
    vec3 planetCenter = modelMatrix[3].xyz;
    vec3 toPlanetCenter = normalize(worldPosition.xyz - planetCenter);
    
    // Calcul de la hauteur atmosphérique
    float distanceFromCenter = length(worldPosition.xyz - planetCenter);
    vAtmosphereFactor = clamp((distanceFromCenter - planetRadius) / atmosphereHeight, 0.0, 1.0);
    
    // Rotation subtile pour l'effet nuageux
    float rotationAngle = time * 0.1;
    vec3 rotatedPosition = rotateY(position, rotationAngle);
    
    vec4 viewPosition = modelViewMatrix * vec4(rotatedPosition, 1.0);
    vPosition = viewPosition.xyz;
    
    // Direction de vue pour l'effet de scattering
    vViewDirection = normalize(cameraPosition - worldPosition.xyz);
    vFragmentPosition = worldPosition.xyz;
    
    // Normales pour l'éclairage
    vNormal = normalize(normalMatrix * normal);
    
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = 2.0;
}