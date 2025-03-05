/**
 * Escena.js - Cancha de Baloncesto Mejorada
 */

// Variables globales
let renderer, scene, camera, ball, clock, controls, scoreboard, player;
let keys = {};
let ballVelocity = { x: 0, z: 0, y: 0 };
const speed = 0.1;
const gravity = -0.02;
let score = { teamA: 0, teamB: 0 };

init();
loadScene();
render();

function init() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 25);
    
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    
    clock = new THREE.Clock();
    
    window.addEventListener('keydown', (event) => keys[event.key.toLowerCase()] = true);
    window.addEventListener('keyup', (event) => keys[event.key.toLowerCase()] = false);
}

function loadScene() {
    const loader = new THREE.GLTFLoader();
    
    // Cargar cancha
    loader.load('models/cancha.glb', function (gltf) {
        const cancha = gltf.scene;
        cancha.position.set(0, 0, 0);
        cancha.scale.set(1, 1, 1);
        scene.add(cancha);
    }, undefined, function (error) {
        console.error('Error al cargar la cancha:', error);
    });
    
    // Cargar canastas
    loader.load('models/canasta/canasta.glb', function (gltf) {
        const canasta1 = gltf.scene.clone();
        const canasta2 = gltf.scene.clone();
        
        canasta1.position.set(-4.5, 3, -9);
        canasta2.position.set(4.5, 3, 9);
        
        scene.add(canasta1);
        scene.add(canasta2);
    }, undefined, function (error) {
        console.error('Error al cargar las canastas:', error);
    });
    
    // Cargar jugador
    loader.load('models/jugador/jugador.glb', function (gltf) {
        player = gltf.scene;
        player.position.set(0, 0, 0);
        player.scale.set(1, 1, 1);
        scene.add(player);
    }, undefined, function (error) {
        console.error('Error al cargar el jugador:', error);
    });
    
    createScoreboard();
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);
}

function createScoreboard() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'white';
    context.font = '20px Arial';
    context.fillText(`Team A: ${score.teamA} - Team B: ${score.teamB}`, 20, 60);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const scoreboardGeometry = new THREE.PlaneGeometry(4, 2);
    scoreboard = new THREE.Mesh(scoreboardGeometry, material);
    scoreboard.position.set(0, 6, -11);
    scene.add(scoreboard);
}

function update() {
    controls.update();
}

function render() {
    requestAnimationFrame(render);
    update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
