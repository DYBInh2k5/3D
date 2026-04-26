import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { gsap } from 'gsap';
import GUI from 'lil-gui';

// --- INITIALIZATION ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ReinhardToneMapping;
document.getElementById('app').appendChild(renderer.domElement);

// --- POST PROCESSING ---
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5, // strength
  0.4, // radius
  0.85 // threshold
);

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// --- CONTROLS ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// --- LIGHTING ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const pointLight1 = new THREE.PointLight(0x00ff88, 20, 100);
pointLight1.position.set(5, 5, 5);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xff0088, 20, 100);
pointLight2.position.set(-5, -5, 5);
scene.add(pointLight2);

// --- PARTICLES (STARS) ---
const particlesCount = 5000;
const positions = new Float32Array(particlesCount * 3);
for (let i = 0; i < particlesCount * 3; i++) {
  positions[i] = (Math.random() - 0.5) * 20;
}
const particlesGeo = new THREE.BufferGeometry();
particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const particlesMat = new THREE.PointsMaterial({
  size: 0.02,
  color: 0xffffff,
  transparent: true,
  opacity: 0.8,
  sizeAttenuation: true
});
const particleSystem = new THREE.Points(particlesGeo, particlesMat);
scene.add(particleSystem);

// --- ADVANCED SHAPES ---
const shapes = [];
const params = {
  bloomStrength: 1.5,
  bloomRadius: 0.4,
  bloomThreshold: 0.85,
  rotationSpeed: 1,
  floatSpeed: 1
};

// Common material (Glass-like)
const advancedMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0.1,
  roughness: 0.05,
  transmission: 0.9,
  thickness: 0.5,
  ior: 1.5,
  iridescence: 1,
  iridescenceIOR: 1.3,
  sheen: 1,
  sheenRoughness: 0.2,
  sheenColor: 0xffffff
});

// 1. Icosahedron (Geometric crystal)
const crystalGeo = new THREE.IcosahedronGeometry(1.5, 0);
const crystal = new THREE.Mesh(crystalGeo, advancedMaterial.clone());
crystal.material.color.set(0x00ffff);
crystal.position.x = -3;
scene.add(crystal);
shapes.push(crystal);

// 2. Torus Knot (Complex shape)
const knotGeo = new THREE.TorusKnotGeometry(1, 0.3, 128, 16);
const knot = new THREE.Mesh(knotGeo, advancedMaterial.clone());
knot.material.color.set(0xff00ff);
knot.position.x = 0;
scene.add(knot);
shapes.push(knot);

// 3. Octahedron
const octGeo = new THREE.OctahedronGeometry(1.5, 0);
const oct = new THREE.Mesh(octGeo, advancedMaterial.clone());
oct.material.color.set(0xffff00);
oct.position.x = 3;
scene.add(oct);
shapes.push(oct);

// --- GUI SETUP ---
const gui = new GUI();
const bloomFolder = gui.addFolder('Bloom Effects');
bloomFolder.add(params, 'bloomStrength', 0, 3).onChange(v => bloomPass.strength = v);
bloomFolder.add(params, 'bloomRadius', 0, 1).onChange(v => bloomPass.radius = v);
bloomFolder.add(params, 'bloomThreshold', 0, 1).onChange(v => bloomPass.threshold = v);

const animationFolder = gui.addFolder('Animation');
animationFolder.add(params, 'rotationSpeed', 0, 5);
animationFolder.add(params, 'floatSpeed', 0, 5);

// --- INTERACTIVITY (RAYCASTER) ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('click', () => {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(shapes);
  
  if (intersects.length > 0) {
    const object = intersects[0].object;
    gsap.to(object.scale, {
      x: 1.5, y: 1.5, z: 1.5,
      duration: 0.3,
      yoyo: true,
      repeat: 1,
      ease: "power2.out"
    });
    
    // Change color randomly
    object.material.color.setHSL(Math.random(), 1, 0.5);
  }
});

// --- RENDER LOOP ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// Use performance.now() or a simple timer for animation
let lastTime = 0;

function animate(currentTime) {
  requestAnimationFrame(animate);
  
  // Convert to seconds
  const elapsedTime = currentTime * 0.001 || 0;
  const deltaTime = elapsedTime - lastTime;
  lastTime = elapsedTime;

  // Update particles
  particleSystem.rotation.y = elapsedTime * 0.05;

  // Update shapes
  shapes.forEach((shape, index) => {
    shape.rotation.x = elapsedTime * 0.5 * params.rotationSpeed;
    shape.rotation.y = elapsedTime * 0.3 * params.rotationSpeed;
    
    // Floating movement
    shape.position.y = Math.sin(elapsedTime * params.floatSpeed + index) * 0.5;
  });

  // Hover effect using Raycaster
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(shapes);
  
  shapes.forEach(s => s.material.emissiveIntensity = 0); // Reset
  if (intersects.length > 0) {
    intersects[0].object.material.emissive.set(0xffffff);
    intersects[0].object.material.emissiveIntensity = 0.5;
  }

  controls.update();
  composer.render();
}

animate();
