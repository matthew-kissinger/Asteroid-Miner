// planetTextures.js - Planet texture loading and management

import * as THREE from 'three';

const textureLoader = new THREE.TextureLoader();

// Load all planet textures
export const planetTextures = {
    mercury: textureLoader.load('./assets/2k_mercury.jpg'),
    venus: {
        surface: textureLoader.load('./assets/2k_venus_surface.jpg'),
        atmosphere: textureLoader.load('./assets/2k_venus_atmosphere.jpg')
    },
    earth: textureLoader.load('./assets/2k_earth_daymap.jpg'),
    mars: textureLoader.load('./assets/2k_mars.jpg'),
    jupiter: textureLoader.load('./assets/2k_jupiter.jpg'),
    saturn: {
        surface: textureLoader.load('./assets/2k_saturn.jpg'),
        rings: textureLoader.load('./assets/2k_saturn_ring_alpha.png')
    },
    uranus: textureLoader.load('./assets/2k_uranus.jpg'),
    neptune: textureLoader.load('./assets/2k_neptune.jpg')
};

// Set the correct color space for all planet textures
planetTextures.mercury.colorSpace = THREE.SRGBColorSpace;
planetTextures.venus.surface.colorSpace = THREE.SRGBColorSpace;
planetTextures.venus.atmosphere.colorSpace = THREE.SRGBColorSpace;
planetTextures.earth.colorSpace = THREE.SRGBColorSpace;
planetTextures.mars.colorSpace = THREE.SRGBColorSpace;
planetTextures.jupiter.colorSpace = THREE.SRGBColorSpace;
planetTextures.saturn.surface.colorSpace = THREE.SRGBColorSpace;
planetTextures.saturn.rings.colorSpace = THREE.SRGBColorSpace;
planetTextures.uranus.colorSpace = THREE.SRGBColorSpace;
planetTextures.neptune.colorSpace = THREE.SRGBColorSpace;

// Load the custom procedural textures (p1-p22)
export const proceduralTextures = [];
for (let i = 1; i <= 22; i++) {
    const texture = textureLoader.load(`./assets/p${i}.jpeg`);
    texture.colorSpace = THREE.SRGBColorSpace;
    proceduralTextures.push(texture);
}