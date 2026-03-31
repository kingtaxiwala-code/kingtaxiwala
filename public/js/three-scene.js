document.addEventListener('DOMContentLoaded', () => {
    // Basic Three.js Setup
    const container = document.getElementById('three-canvas-container');
    if(!container) return;

    const scene = new THREE.Scene();
    // Add subtle fog to blend the scene into the black background
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.05);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3, 12);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xc5a059, 1); // Gold tint
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    const blueLight = new THREE.PointLight(0x0A192F, 2, 50); // Dark blue accent
    blueLight.position.set(-5, 0, -5);
    scene.add(blueLight);

    // --- Create a stylized "Luxury Car" representation using Primitives ---
    // In a production app, use GLTFLoader to load a real .gltf car model.
    const carGroup = new THREE.Group();

    // Materials
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFFFFFF, // White Innova Crysta
        metalness: 0.6, 
        roughness: 0.2,
        envMapIntensity: 1.0
    });
    const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x0A192F,
        metalness: 0.1,
        roughness: 0.1,
        transparent: true,
        opacity: 0.8,
        transmission: 0.9,
        ior: 1.5
    });
    const goldMaterial = new THREE.MeshStandardMaterial({
        color: 0xc5a059, // Gold
        metalness: 1.0,
        roughness: 0.2
    });

    // Main Body
    const bodyGeom = new THREE.BoxGeometry(4, 1.2, 8.5); // Slightly larger for Innova feel
    const bodyMesh = new THREE.Mesh(bodyGeom, bodyMaterial);
    bodyMesh.position.y = 0.6;
    carGroup.add(bodyMesh);

    // Cabin
    const cabinGeom = new THREE.BoxGeometry(3.5, 1.2, 5); // Longer cabin
    const cabinMesh = new THREE.Mesh(cabinGeom, glassMaterial);
    cabinMesh.position.set(0, 1.8, -0.5);
    carGroup.add(cabinMesh);

    // Wheels
    const wheelGeom = new THREE.CylinderGeometry(0.7, 0.7, 0.4, 32);
    wheelGeom.rotateZ(Math.PI / 2);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9 });

    const wheelPositions = [
        [-2.1, 0.7, 2.5],  // Front Left
        [2.1, 0.7, 2.5],   // Front Right
        [-2.1, 0.7, -2.5], // Back Left
        [2.1, 0.7, -2.5]   // Back Right
    ];

    wheelPositions.forEach(pos => {
        const wheelGroup = new THREE.Group();
        const wheel = new THREE.Mesh(wheelGeom, wheelMaterial);
        
        // Gold / Silver Rim
        const rimGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.42, 16);
        rimGeom.rotateZ(Math.PI / 2);
        const rim = new THREE.Mesh(rimGeom, goldMaterial);

        wheelGroup.add(wheel);
        wheelGroup.add(rim);
        wheelGroup.position.set(...pos);
        carGroup.add(wheelGroup);
    });

    // Headlights
    const lightGeom = new THREE.BoxGeometry(0.8, 0.3, 0.1);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Glow wait white
    
    const hlLeft = new THREE.Mesh(lightGeom, lightMat);
    hlLeft.position.set(-1.2, 0.8, 4.3);
    carGroup.add(hlLeft);

    const hlRight = new THREE.Mesh(lightGeom, lightMat);
    hlRight.position.set(1.2, 0.8, 4.3);
    carGroup.add(hlRight);
    
    // Add point lights for headlights
    const hlLightLeft = new THREE.PointLight(0xffffff, 1, 10);
    hlLightLeft.position.set(-1.2, 0.8, 4.8);
    carGroup.add(hlLightLeft);

    const hlLightRight = new THREE.PointLight(0xffffff, 1, 10);
    hlLightRight.position.set(1.2, 0.8, 4.8);
    carGroup.add(hlLightRight);

    // Taillights
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const tlLeft = new THREE.Mesh(lightGeom, tailMat);
    tlLeft.position.set(-1.2, 0.8, -4.3);
    carGroup.add(tlLeft);

    const tlRight = new THREE.Mesh(lightGeom, tailMat);
    tlRight.position.set(1.2, 0.8, -4.3);
    carGroup.add(tlRight);

    // --- Number Plate ---
    const plateCanvas = document.createElement('canvas');
    plateCanvas.width = 512;
    plateCanvas.height = 128;
    const ctx = plateCanvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#FFD700'; // Yellow commercial plate
    ctx.fillRect(0, 0, 512, 128);
    // Border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, 502, 118);
    // Text
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 60px Montserrat, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('KING TAXIWALA', 256, 64);

    const plateTexture = new THREE.CanvasTexture(plateCanvas);
    const plateMat = new THREE.MeshBasicMaterial({ map: plateTexture });
    const plateGeom = new THREE.PlaneGeometry(1.5, 0.4);
    
    // Front Plate
    const frontPlate = new THREE.Mesh(plateGeom, plateMat);
    frontPlate.position.set(0, 0.4, 4.26);
    carGroup.add(frontPlate);

    // Back Plate
    const backPlate = new THREE.Mesh(plateGeom, plateMat);
    backPlate.position.set(0, 0.4, -4.26);
    backPlate.rotation.y = Math.PI;
    carGroup.add(backPlate);

    scene.add(carGroup);

    // --- Particles for speed/luxury effect ---
    const particlesGeom = new THREE.BufferGeometry();
    const particleCount = 500;
    const posArray = new Float32Array(particleCount * 3);
    for(let i=0; i<particleCount*3; i++) {
        posArray[i] = (Math.random() - 0.5) * 40;
    }
    particlesGeom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({
        size: 0.05,
        color: 0xc5a059, // Gold particles
        transparent: true,
        opacity: 0.8
    });
    const particlesMesh = new THREE.Points(particlesGeom, particleMat);
    scene.add(particlesMesh);

    // Add ground reflection plane
    const planeGeom = new THREE.PlaneGeometry(100, 100);
    const planeMat = new THREE.MeshStandardMaterial({
        color: 0x050505,
        metalness: 0.8,
        roughness: 0.2
    });
    const plane = new THREE.Mesh(planeGeom, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = 0;
    scene.add(plane);


    // --- Mouse Tracking ---
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // --- Animation Loop ---
    const clock = new THREE.Clock();
    
    // Position car initially
    carGroup.position.y = 0;
    carGroup.rotation.y = Math.PI / 4; // Angle to show initially

    function animate() {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        // Target positions based on mouse
        targetX = mouseX * 0.5;
        targetY = mouseY * 0.2;

        // Smooth Lerp for Car Rotation
        // Base rotation is PI/4, add sine wave for idle feel, plus mouse influence
        const baseRotation = Math.PI / 4;
        const idleRot = Math.sin(elapsedTime * 0.2) * 0.2;
        carGroup.rotation.y += ((baseRotation + idleRot + targetX) - carGroup.rotation.y) * 0.05;
        carGroup.rotation.x += (-targetY - carGroup.rotation.x) * 0.05;

        // Smooth Lerp for Camera Parallax
        camera.position.x += (mouseX * 2 - camera.position.x) * 0.05;
        camera.position.y += (mouseY * 1 + 3 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        // Hover effect (idle bobbing)
        carGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.1;

        // Rotate particles slowly
        particlesMesh.rotation.y = elapsedTime * 0.05;

        renderer.render(scene, camera);
    }
    animate();

    // --- Resize Handler ---
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});
