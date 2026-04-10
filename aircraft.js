// aircraft.js
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export function createB737() {
    const airplane = new THREE.Group(); 
    
    // --- MATERIALS ---
    const whiteMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    // DoubleSide is critical so the mirrored left wing doesn't turn invisible!
    const grayMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide });
    const blackMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const strutMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });

    // --- 1. FUSELAGE ---
    // --- 1. FUSELAGE ---
    const fuselageGroup = new THREE.Group();

    // Center Cabin
    const cabinGeom = new THREE.CylinderGeometry(0.5, 0.5, 3.5, 16);
    cabinGeom.rotateX(Math.PI / 2);
    const cabin = new THREE.Mesh(cabinGeom, whiteMaterial);
    fuselageGroup.add(cabin);

    // Nose Cone
    const noseGeom = new THREE.CylinderGeometry(0.05, 0.5, 1.2, 16);
    noseGeom.rotateX(-Math.PI/2);
    const nose = new THREE.Mesh(noseGeom, whiteMaterial);
    nose.position.z = -2.35; // Center + half length
    fuselageGroup.add(nose);

    // Tail Cone (Upswept / Non-axisymmetric look)
    const tailGeom = new THREE.CylinderGeometry(0.5, 0.1, 1.8, 16);
    tailGeom.rotateX(-Math.PI/2);
    const tail = new THREE.Mesh(tailGeom, whiteMaterial);
    // Shift it UP and angle it UP to create a flat belly and tapered roof
    tail.position.set(0, 0.15, 2.65); 
    tail.rotation.x = -0.15;          
    fuselageGroup.add(tail);

    airplane.add(fuselageGroup);
    // --- 2. TAPERED WINGS WITH DIHEDRAL ---
    const wingShape = new THREE.Shape();
    const rootChord = 1.8;
    const tipChord = 0.6;
    const span = 3.0;
    const sweep = 30.5 * (Math.PI / 180); 
    
    // Dihedral Angle: 5 degrees
    const dihedralAngle = 0 * (Math.PI / 180); 

    // Draw the 2D Planform
    wingShape.moveTo(0, 0);                          
    wingShape.lineTo(span, sweep);                  
    wingShape.lineTo(span, sweep - tipChord);       
    wingShape.lineTo(0, -rootChord);                 
    wingShape.lineTo(0, 0);                          

    // Extrude into 3D
    const extrudeSettings = {
        depth: 0.1, 
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize: 0.02,
        bevelThickness: 0.02
    };
    const wingGeom = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
    wingGeom.rotateX(Math.PI / 2); // Lay flat

    // Right Wing
    const rightWing = new THREE.Mesh(wingGeom, grayMaterial);
    rightWing.position.set(0.5, 0, 0.5); 
    rightWing.rotation.z = dihedralAngle; // Tilt tip UP
    airplane.add(rightWing);

    // Left Wing
    const leftWing = new THREE.Mesh(wingGeom, grayMaterial);
    leftWing.scale.set(-1, 1, 1); // Mirror the geometry
    leftWing.position.set(-0.5, 0, 0.5); 
    leftWing.rotation.z = -dihedralAngle; // Tilt tip UP (mirrored)
    airplane.add(leftWing);

    // --- 3. TAIL SECTION ---
    // Vertical Stabilizer (Rudder)
    const vTailGeom = new THREE.BoxGeometry(0.1, 1.5, 1);
    const vTail = new THREE.Mesh(vTailGeom, grayMaterial);
    vTail.position.set(0, 0.8, 2.5); 
    vTail.rotation.x = -0.2; // Sweep back slightly
    airplane.add(vTail);

    // Horizontal Stabilizers (Elevators)
    const hTailGeom = new THREE.BoxGeometry(2, 0.1, 0.8);
    const hTail = new THREE.Mesh(hTailGeom, grayMaterial);
    hTail.position.set(0, 0.2, 2.7);
    airplane.add(hTail);

    // --- 4. LANDING GEAR ---
    const wheelGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
    wheelGeom.rotateZ(Math.PI / 2); // Stand wheel upright

    // Nose Gear (Front)
    const noseGear = new THREE.Group();
    const noseWheel = new THREE.Mesh(wheelGeom, blackMaterial);
    noseWheel.position.y = -0.8;
    const noseStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8), strutMaterial);
    noseStrut.position.y = -0.4;
    noseGear.add(noseWheel, noseStrut);
    noseGear.position.set(0, 0, -2.5);
    airplane.add(noseGear);

    // Main Gear (Left & Right, slightly behind Center of Gravity)
    const mainGearGeom = new THREE.Group();
    const leftWheel = new THREE.Mesh(wheelGeom, blackMaterial);
    leftWheel.position.set(-1.2, -0.8, 0);
    const rightWheel = new THREE.Mesh(wheelGeom, blackMaterial);
    rightWheel.position.set(1.2, -0.8, 0);
    const mainStrutL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8), strutMaterial);
    mainStrutL.position.set(-1.2, -0.4, 0);
    const mainStrutR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8), strutMaterial);
    mainStrutR.position.set(1.2, -0.4, 0);
    
    mainGearGeom.add(leftWheel, rightWheel, mainStrutL, mainStrutR);
    mainGearGeom.position.set(0, 0, 0.5); 
    airplane.add(mainGearGeom);

    // --- 5. PHYSICS MARKERS (Optional, for visual debugging) ---
    const cgMarker = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({color: 0xff0000}));
    airplane.add(cgMarker); // Red dot at 0,0,0 (Center of Gravity)

    const acMarker = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({color: 0x0000ff}));
    acMarker.position.z = 0.5; 
    airplane.add(acMarker); // Blue dot behind CG (Aerodynamic Center)

    // --- 6. AERODYNAMIC SPECIFICATIONS ---
    return {
        mesh: airplane,
        specs: {
            mass: 400,      // kg (Reduced weight for the smaller wing profile)
            wingArea: 10,    // Total surface area of the new wings
            mac: 4.0,         // Mean Aerodynamic Chord
            cgZ: 0.0,         // Center of Gravity location
            acZ: 0.1,         // Aerodynamic Center location
            maxThrust: 3000 // Max engine force in Newtons
        }
    };
}
