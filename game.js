// game.js
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { createB737 } from './aircraft.js';
import { FlightPhysics } from './physics.js';
import { createTerrain } from './terrain.js';

// -----------------------------------------
// 1. SCENE SETUP
// -----------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); 
// Add fog to hide the edge of the procedural terrain
scene.fog = new THREE.Fog(0x87CEEB, 1000, 5000); 

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

// -----------------------------------------
// 2. ENVIRONMENT & AIRCRAFT
// -----------------------------------------
const terrain = createTerrain();
scene.add(terrain);

const aircraftData = createB737();
const airplane = aircraftData.mesh;
// Start sitting on the runway (ground clearance is 1.1)
airplane.position.y = 1.1; 
scene.add(airplane);

const physics = new FlightPhysics(aircraftData);

// -----------------------------------------
// 3. CAMERA SETUP
// -----------------------------------------
airplane.add(camera);
camera.position.set(0, 4, 15); 
camera.lookAt(0, 0, 0);       

// -----------------------------------------
// 4. INPUT MANAGEMENT
// -----------------------------------------
const keys = {};
window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

// -----------------------------------------
// 5. HUD ELEMENTS (DOM References)
// -----------------------------------------
const uiThrottle = document.getElementById('ui-throttle');
const uiSpeed = document.getElementById('ui-speed');
const uiAlt = document.getElementById('ui-alt');
const skyElement = document.getElementById('sky');
const compassRing = document.getElementById('compass-ring');
const tcPlane = document.getElementById('tc-plane');
const uiTrim = document.getElementById('ui-trim');

const clock = new THREE.Clock();

// -----------------------------------------
// 6. MAIN GAME LOOP
// -----------------------------------------
function animate() {
    requestAnimationFrame(animate);

    const dt = clock.getDelta(); 

    // Update Physics Engine
    physics.update(keys, dt);

    // --- UPDATE TEXT STATS ---
    uiThrottle.innerText = Math.round(physics.throttle * 100);
    uiSpeed.innerText = Math.round(physics.velocity.length() * 1.944); // m/s to knots
    // Subtract 1.1 (gear height) so ground altitude is exactly 0
    uiAlt.innerText = Math.max(0, Math.round((airplane.position.y - 1.1) * 3.28)); 
    uiTrim.innerText = Math.round(physics.state.trim);

    // --- UPDATE GYROSCOPIC GAUGES ---
    // Read from the bulletproof vector state, NOT the Euler rotations
    const pitchOffset = physics.state.pitch * 50; 
    const rollDegrees = physics.state.roll * (180 / Math.PI); 
    
    // 1. Attitude Indicator
    skyElement.style.transform = `translateY(${pitchOffset}px) rotate(${rollDegrees}deg)`;

    // 2. Heading Indicator (Compass)
    let headingDegrees = physics.state.heading * (180 / Math.PI);
    if (headingDegrees < 0) headingDegrees += 360; // Keep between 0 and 360
    // Rotate ring in reverse so the bug points to the correct heading
    compassRing.style.transform = `rotate(${-headingDegrees}deg)`;

    // 3. Turn Coordinator
    tcPlane.style.transform = `translate(-50%, -50%) rotate(${rollDegrees}deg)`;

    renderer.render(scene, camera);
}

animate();