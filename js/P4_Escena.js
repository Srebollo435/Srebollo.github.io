import * as THREE from "../lib/three.module.js";
import { TWEEN } from '/lib/tween.module.min.js';

let renderer, scene, cameraPerspective, cameraOrtho, controls;
let ambientLight, directionalLight, spotLight;
let videoTexture;
let selectedObject = null;

init();
loadScene();
loadGUI();
render();

function init() {
    // Motor de render
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);
    
    // Escena
    scene = new THREE.Scene();
    
    // Cámaras
    cameraPerspective = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    cameraPerspective.position.set(5, 5, 10);
    
    cameraOrtho = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 100);
    cameraOrtho.position.set(0, 10, 0);
    cameraOrtho.lookAt(0, 0, 0);
    
    controls = new OrbitControls(cameraPerspective, renderer.domElement);
    
    // Luces
    ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(0, 10, 0);
    spotLight.castShadow = true;
    scene.add(spotLight);
    
    // Eventos
    window.addEventListener('resize', updateAspectRatio);
    renderer.domElement.addEventListener('dblclick', onDoubleClick);
}

function loadScene() {
    // Habitacion de entorno
    const room = new THREE.BoxGeometry(10, 10, 10);
    const roomMaterial = new THREE.MeshPhongMaterial({ color: 0x808080, side: THREE.BackSide });
    const roomMesh = new THREE.Mesh(room, roomMaterial);
    scene.add(roomMesh);
    
    // Video-textura en el suelo
    const video = document.createElement('video');
    video.src = 'video.mp4';
    video.loop = true;
    video.muted = true;
    video.play();
    videoTexture = new THREE.VideoTexture(video);
    
    const floorGeometry = new THREE.PlaneGeometry(10, 10);
    const floorMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
}

function loadGUI() {
    const gui = new GUI();
    const params = {
        animate: () => animate(),
        pentagonRadius: 1,
        wireframe: false,
        shadows: true,
        color: '#ff0000',
        play: true,
        mute: false
    };
    
    gui.add(params, 'animate');
    gui.add(params, 'pentagonRadius', 0.5, 3).onChange(value => {
        if (selectedObject) selectedObject.scale.set(value, value, value);
    });
    gui.add(params, 'wireframe').onChange(value => {
        if (selectedObject) selectedObject.material.wireframe = value;
    });
    gui.add(params, 'shadows').onChange(value => {
        renderer.shadowMap.enabled = value;
    });
    gui.addColor(params, 'color').onChange(value => {
        if (selectedObject) selectedObject.material.color.set(value);
    });
    gui.add(params, 'play').onChange(value => {
        videoTexture.image.paused = !value;
    });
    gui.add(params, 'mute').onChange(value => {
        videoTexture.image.muted = value;
    });
}

function updateAspectRatio() {
    cameraPerspective.aspect = window.innerWidth / window.innerHeight;
    cameraPerspective.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDoubleClick(event) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraPerspective);
    
    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) {
        selectedObject = intersects[0].object;
        animate();
    }
}

function animate() {
    if (selectedObject) {
        new TWEEN.Tween(selectedObject.position)
            .to({ y: selectedObject.position.y + 1 }, 500)
            .easing(TWEEN.Easing.Quadratic.Out)
            .yoyo(true)
            .repeat(1)
            .start();
    }
}

function update(delta) {
    TWEEN.update(delta);
}

function render(delta) {
    requestAnimationFrame(render);
    update(delta);
    
    renderer.clear();
    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.render(scene, cameraPerspective);
    
    renderer.setViewport(0, window.innerHeight - window.innerHeight / 8, window.innerHeight / 8, window.innerHeight / 8);
    renderer.render(scene, cameraOrtho);
}