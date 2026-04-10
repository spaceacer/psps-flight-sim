// terrain.js
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export function createTerrain() {
    const terrainGroup = new THREE.Group();

    // 1. Generate a procedural checkerboard texture using Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Draw base dark green
    ctx.fillStyle = '#3b5e2b';
    ctx.fillRect(0, 0, 512, 512);
    // Draw lighter green squares
    ctx.fillStyle = '#2c4520';
    for (let i = 0; i < 512; i += 256) {
        for (let j = 0; j < 512; j += 256) {
            if ((i / 256 + j / 256) % 2 === 0) ctx.fillRect(i, j, 256, 256);
        }
    }

    const groundTexture = new THREE.CanvasTexture(canvas);
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(200, 200); // Tile the texture massively

    // 2. The Ground
    const groundGeom = new THREE.PlaneGeometry(20000, 20000);
    const groundMat = new THREE.MeshStandardMaterial({ 
        map: groundTexture, 
        roughness: 0.9
    }); 
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2; 
    terrainGroup.add(ground);

    // 3. The Runway
    const runwayGeom = new THREE.PlaneGeometry(20, 4000);
    const runwayMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    const runway = new THREE.Mesh(runwayGeom, runwayMat);
    runway.rotation.x = -Math.PI / 2;
    runway.position.y = 0.1; 
    runway.position.z = -1500; 
    terrainGroup.add(runway);

    // 4. Scatter random reference objects (buildings/towers)
    const buildingGeom = new THREE.BoxGeometry(20, 100, 20);
    const buildingMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    for(let i = 0; i < 50; i++) {
        const building = new THREE.Mesh(buildingGeom, buildingMat);
        // Randomly place along the sides of the runway
        building.position.x = (Math.random() > 0.5 ? 1 : -1) * (100 + Math.random() * 500);
        building.position.z = Math.random() * -4000;
        building.position.y = 10; // Half height so it sits on ground
        terrainGroup.add(building);
    }

    return terrainGroup;
}