// physics.js
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class FlightPhysics {
    constructor(aircraftData) {
        this.mesh = aircraftData.mesh;
        this.specs = aircraftData.specs;
        
        this.rho = 1.225; 
        this.gravity = 9.81; 
        
        this.velocity = new THREE.Vector3(0, 0, 0); 
        this.throttle = 0; 
        
        // Flight state includes Trim and Rudder now
        this.state = { pitch: 0, roll: 0, heading: 0, trim: 0, rudder: 0 };
    }

    update(keys, dt) {
        // -----------------------------------------
        // 1. PILOT INPUTS & KINEMATICS
        // -----------------------------------------
        if (keys['q']) this.throttle = Math.min(1.0, this.throttle + 0.005); 
        if (keys['z']) this.throttle = Math.max(0.0, this.throttle - 0.01);

        if (keys['g']) this.state.trim += 50 * dt; 
        if (keys['t']) this.state.trim -= 50 * dt; 
        this.state.trim = THREE.MathUtils.clamp(this.state.trim, -15, 15);

        const rotSpeed = 0.5 * dt;
        if (keys['s'] || keys['arrowdown']) this.mesh.rotateX(rotSpeed); 
        if (keys['w'] || keys['arrowup']) this.mesh.rotateX(-rotSpeed); 
        if (keys['a'] || keys['arrowleft']) this.mesh.rotateZ(rotSpeed); 
        if (keys['d'] || keys['arrowright']) this.mesh.rotateZ(-rotSpeed);

        // --- RUDDER CONTROLS (< / , = Left, > / . = Right) ---
        if (keys[','] || keys['<']) {
            this.state.rudder = Math.max(-1.0, this.state.rudder - 0.02 * dt);
        } else if (keys['.'] || keys['>']) {
            this.state.rudder = Math.min(1.0, this.state.rudder + 0.02 * dt);
        } else {
            this.state.rudder *= (1 - 10.0 * dt); // Auto-center spring
        }

        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.mesh.quaternion);
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.mesh.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.mesh.quaternion);

        this.state.pitch = Math.asin(THREE.MathUtils.clamp(forward.y, -1, 1)); 
        this.state.roll = Math.asin(THREE.MathUtils.clamp(right.y, -1, 1)); 
        this.state.heading = Math.atan2(forward.x, -forward.z);

        // -----------------------------------------
        // 2. TRUE ANGLE OF ATTACK & SIDESLIP
        // -----------------------------------------
        const speed = this.velocity.length(); 
        
        const localVel = this.velocity.clone().applyQuaternion(this.mesh.quaternion.clone().invert());
        
        let alpha = 0;
        if (speed > 2) {
            alpha = Math.atan2(-localVel.y, -localVel.z);
        }

        let CL = 0.1 + (5.5 * alpha); 
        let CD = 0.02 + (1.2 * alpha * alpha); 
        if (alpha > 0.3) { CL = 0.0; CD += 0.5; } // Stall

        const dynamicPressure = 0.5 * this.rho * speed * speed; 

        // -----------------------------------------
        // 3. CALCULATE 3D FORCES
        // -----------------------------------------
        const weightForce = new THREE.Vector3(0, -this.specs.mass * this.gravity, 0);
        const thrustForce = forward.clone().multiplyScalar(this.throttle * this.specs.maxThrust);
        const liftMagnitude = dynamicPressure * this.specs.wingArea * CL;
        const liftForce = up.clone().multiplyScalar(liftMagnitude);
        
        const dragDir = speed > 0.1 ? this.velocity.clone().normalize().negate() : new THREE.Vector3();
        const dragForce = dragDir.multiplyScalar(dynamicPressure * this.specs.wingArea * CD);

        const totalForce = new THREE.Vector3()
            .add(weightForce)
            .add(thrustForce)
            .add(liftForce)
            .add(dragForce);

        // -----------------------------------------
        // 4. WEATHER-VANING & RUDDER AUTHORITY
        // -----------------------------------------
        const isGrounded = this.mesh.position.y <= 1.1;

        if (speed > 5 && !isGrounded) {
            // Weather-vaning (Air naturally pushes the tail back straight)
            const yawCorrection = -localVel.x * 0.02 * dt;
            
            // Active Rudder (Scales with air pressure so it bites harder at high speeds)
            const rudderTorque = -this.state.rudder * dynamicPressure * 0.001 * dt;
            
            this.mesh.rotateY(yawCorrection + rudderTorque);

            const pitchCorrection = localVel.y * 0.02 * dt; 
            const trimForce = this.state.trim * 0.005 * dt;
            this.mesh.rotateX(pitchCorrection + trimForce);
        }

        // -----------------------------------------
        // 5. INTEGRATE PHYSICS (Apply Acceleration)
        // -----------------------------------------
        const acceleration = totalForce.divideScalar(this.specs.mass);
        this.velocity.add(acceleration.clone().multiplyScalar(dt));

        // -----------------------------------------
        // 6. GROUND COLLISIONS & FRICTION
        // -----------------------------------------
        if (isGrounded) {
            this.mesh.position.y = 1.1;
            if (this.velocity.y < 0) this.velocity.y = 0; 

            // NOSE-WHEEL STEERING: Turn the plane on the ground using the rudder pedals
            if (speed > 1) {
                const steering = -this.state.rudder * (speed * 0.05) * dt;
                this.mesh.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), steering);
            }

            const euler = new THREE.Euler().setFromQuaternion(this.mesh.quaternion, 'YXZ');
            if (euler.x < 0) { 
                euler.x = 0; 
                this.mesh.quaternion.setFromEuler(euler); 
            }

            const groundedVel = this.velocity.clone().applyQuaternion(this.mesh.quaternion.clone().invert());
            groundedVel.x *= (1 - 2.0 * dt); 
            groundedVel.z *= (1 - 0.05 * dt); 
            
            this.velocity.copy(groundedVel.applyQuaternion(this.mesh.quaternion));
        } 
        
        // Move the 3D model
        this.mesh.position.add(this.velocity.clone().multiplyScalar(dt));
    }
}