/**
 * Escena.js
 * 
 * Seminario AGM #1. Escena basica en three.js: 
 * Transformaciones, animacion basica y modelos importados
 * 
 * @author <rvivo@upv.es>, 2023
 * 
 */

// Modulos necesarios
import * as THREE from "../lib/three.module.js";
import {GLTFLoader} from "../lib/GLTFLoader.module.js";

// Variables globales
let renderer, scene, camera, ball, clock;

// Acciones
init();
loadScene();
render();

function init() {
    // Motor de render
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    // Escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Color cielo
    
    // Cámara
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    
    // Reloj para la animación
    clock = new THREE.Clock();
}

function loadScene() {
    // Suelo (cancha)
    const floorGeometry = new THREE.PlaneGeometry(10, 20);
    const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x008000, side: THREE.DoubleSide });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Pelota de baloncesto
    const ballGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const ballMaterial = new THREE.MeshBasicMaterial({ color: 0xFF8C00 });
    ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.position.set(0, 0.5, 0);
    scene.add(ball);

    // Canastas
    createHoop(-4.5, 3, -9);
    createHoop(4.5, 3, 9);
}

function createHoop(x, y, z) {
    // Poste
    const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 16);
    const poleMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(x, y - 1.5, z);
    scene.add(pole);
    
    // Tablero
    const boardGeometry = new THREE.BoxGeometry(1.5, 1, 0.1);
    const boardMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.position.set(x, y, z - 0.1);
    scene.add(board);
    
    // Aro
    const hoopGeometry = new THREE.TorusGeometry(0.4, 0.05, 16, 100);
    const hoopMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
    const hoop = new THREE.Mesh(hoopGeometry, hoopMaterial);
    hoop.position.set(x, y - 0.3, z - 0.2);
    hoop.rotation.x = Math.PI / 2;
    scene.add(hoop);
}

function update() {
    let time = clock.getElapsedTime();
    ball.position.y = 0.5 + Math.abs(Math.sin(time * 2)) * 2; // Rebote de la pelota
}

function render() {
    requestAnimationFrame(render);
    update();
    renderer.render(scene, camera);
}

// Ajustar tamaño al cambiar ventana
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
