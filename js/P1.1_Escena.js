    /**
     * S1_Escena.js
     * 
     * Seminario AGM #1. Escena basica en three.js: 
     * Transformaciones, animacion basica y modelos importados
     * 
     * @author <rvivo@upv.es>, 2023
     * 
     */

    // Modulos necesarios
    import * as THREE from "../lib/three.module.js";
    import { GLTFLoader } from "../lib/GLTFLoader.module.js";
    import { OrbitControls } from "../lib/OrbitControls.module.js";
    import {TWEEN} from "../lib/tween.module.min.js";
    import {GUI} from "../lib/lil-gui.module.min.js";
    import {CANNON} from "../lib/cannon-es.module.js";

    // Variables de consenso
    let renderer, scene, camera, controls;
    let cancha, canasta1, canasta2, jugador, pelotsa;
    let physicsWorld, pelotaBody, tableroBody1, tableroBody2, aroBody1, aroBody2;

    let pelotaVelocity = new THREE.Vector3(0, 0, 0); // Velocidad de la pelota
    let keys = {}; // Estado de las teclas
    let lanzando = false; 
    let lastDirection = new THREE.Vector3(0, 0, -1)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    const puntual = new THREE.PointLight(0xFFFFFF, 0.3);
    const focal = new THREE.SpotLight(0xFFFFFF,0.3);

    const campoLimites = {
        minX: -4.8, // Borde izquierdo
        maxX: 4.8,  // Borde derecho
        minZ: -9,   // Línea de fondo detrás de la canasta
        maxZ: 9     // Línea de fondo detrás de la otra canasta
    };
    
    // Acciones
    init();
    initPhysics();
    loadScene();   
    setupGUI(); 
    render();
    

    function init() {
        // Motor de render
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0xffffff); // Fondo blanco
        
        document.getElementById("container").appendChild(renderer.domElement);
        renderer.antialias = true;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Sombras suaves
        // Escena
        scene = new THREE.Scene();

        // Camara
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(0, 5, 10);
        camera.lookAt(0, 0, 0);
        scene.add(camera);

        // Controles de la cámara
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 5;
        controls.maxDistance = 50;

        // Luz ambiental
        // Luz ambiental (ilumina todo suavemente)
        const ambientLight = new THREE.AmbientLight(0x222222, 1);
        scene.add(ambientLight);

        // Luz direccional simulando el sol o luz de gimnasio
        
        directionalLight.position.set(15, 20, 15); // Posicionada en alto
        directionalLight.shadow.mapSize.width = 2048; 
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        
        // **Ajustar el área de sombra para cubrir toda la cancha**
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
         // **Habilitar sombras**
        scene.add(directionalLight);

        
        puntual.position.set(2,7,-4);
        scene.add(puntual);

        //lz puntual prar dar brillo
       
        focal.position.set(-2,7,4);
        focal.target.position.set(0,0,0);
        focal.angle= Math.PI/7;
        focal.penumbra = 0.3;
        focal.castShadow = true; // **Habilitar sombras**
        focal.shadow.camera.far = 20;
        focal.shadow.camera.fov = 80;
        scene.add(focal);

        window.addEventListener("keydown", (event) => {
            if (event.code === "Space" && !lanzando) {
                lanzando = true;
                pelotaVelocity.set(lastDirection.x * 0.2, 0.3, lastDirection.z * 0.2); // 📌 Lanzar en la última dirección
            }
            keys[event.code] = true;
        });
        
        window.addEventListener("keyup", (event) => {
            keys[event.code] = false;
        });
        
    }
    
    function initPhysics() {
        physicsWorld = new CANNON.World();
        physicsWorld.gravity.set(0, -9.82, 0); // Gravedad realista

        // **📌 Crear la física de la pelota**
        let pelotaShape = new CANNON.Sphere(0.3); // Radio de la pelota
        pelotaBody = new CANNON.Body({
            mass: 1, // La pelota es dinámica
            shape: pelotaShape,
            position: new CANNON.Vec3(0, 1, 0), // Posición inicial
            restitution: 0.7, // Rebote
        });
        physicsWorld.addBody(pelotaBody);

        // **📌 Crear la física de los tableros**
        let tableroShape = new CANNON.Box(new CANNON.Vec3(0.6, 0.9, 0.1)); // Tamaño del tablero
        tableroBody1 = new CANNON.Body({
            mass: 0, // 📌 Sin masa (objeto estático)
            shape: tableroShape,
            position: new CANNON.Vec3(0, 2.5, -9), // 📌 Posición del tablero
        });
        physicsWorld.addBody(tableroBody1);

        tableroBody2 = new CANNON.Body({
            mass: 0, // 📌 Sin masa (objeto estático)
            shape: tableroShape,
            position: new CANNON.Vec3(0, 2.5, 9), // 📌 Posición del tablero
        });
        physicsWorld.addBody(tableroBody2);

        // **📌 Crear la física del aro de la canasta**
        let aroShape = new CANNON.Cylinder(0.5, 0.5, 0.1, 20);
        aroBody1 = new CANNON.Body({
            mass: 0, // 📌 Sin masa (objeto estático)
            shape: aroShape,
            position: new CANNON.Vec3(0, 2.3, -9.2), // 📌 Ubicación del aro
        });
        physicsWorld.addBody(aroBody1);

        aroBody2 = new CANNON.Body({
            mass: 0, // 📌 Sin masa (objeto estático)
            shape: aroShape,
            position: new CANNON.Vec3(0, 2.3, 9.2), // 📌 Ubicación del aro
        });
        physicsWorld.addBody(aroBody2);
    }

    function updatePhysics() {
        physicsWorld.step(1 / 60); // Simular física en cada frame
    
        // 📌 Sincronizar la pelota
        pelota.position.copy(pelotaBody.position);
        pelota.quaternion.copy(pelotaBody.quaternion);
    
        // 📌 Sincronizar el tablero y el aro
        canasta1.position.copy(tableroBody1.position);
        canasta2.position.copy(tableroBody2.position);
    }

    function loadScene() {

        const textureLoader = new THREE.TextureLoader();
        const canchaTexture = textureLoader.load("textures/basket.jpg");

        const canchaGeometry = new THREE.PlaneGeometry(10, 18);
        const canchaMaterial = new THREE.MeshStandardMaterial({ 
            map: canchaTexture, 
            roughness: 0.8,  // Reduce el brillo
            metalness: 0.2   // Un poco de reflejo para realismo
        });

        cancha = new THREE.Mesh(canchaGeometry, canchaMaterial);
        cancha.rotation.x = -Math.PI / 2;
        cancha.receiveShadow = true; // **Recibe sombras**
        scene.add(cancha);
        // Crear el suelo de la cancha
  
        const loader = new GLTFLoader();
        
        // Cargar primera canasta
        loader.load("models/canasta/canasta_baloncesto_basketball_hoop/scene.gltf", (gltf) => {
            canasta1 = gltf.scene;
            canasta1.position.set(0, 0, -9);
            canasta1.scale.set(1, 1, 1.6);
            canasta1.castShadow = true;
            canasta1.rotation.y = Math.PI/2; 
            scene.add(canasta1);
        })

        loader.load("models/canasta/canasta_baloncesto_basketball_hoop/scene.gltf", (gltf) => {
            canasta2 = gltf.scene;
            canasta2.position.set(0, 0, 9);
            canasta2.scale.set(1, 1, 1.6);
            canasta2.castShadow = true;
            canasta2.rotation.y = -Math.PI/2; 
            scene.add(canasta2);
        })
        loader.load("models/basketball_ball/scene.gltf", (gltf) => {
            pelota = gltf.scene;
            pelota.position.set(0, 0, 0);
            pelota.scale.set(1, 1, 1);
            pelota.castShadow = true;
            pelota.receiveShadow = true; // **Recibe sombras**
            pelota.rotation.y = -Math.PI/2; 
            scene.add(pelota);
        })
    }


    function mantenerPelotaEnCampo() {
        const radioPelota = 0.3; 
    
        // Chequeo de bordes
        if (pelota.position.x - radioPelota < campoLimites.minX) {
            pelota.position.x = campoLimites.minX + radioPelota;
            pelotaVelocity.x *= -0.6; // Rebote
        }
        if (pelota.position.x + radioPelota > campoLimites.maxX) {
            pelota.position.x = campoLimites.maxX - radioPelota;
            pelotaVelocity.x *= -0.6;
        }
        if (pelota.position.z - radioPelota < campoLimites.minZ) {
            pelota.position.z = campoLimites.minZ + radioPelota;
            pelotaVelocity.z *= -0.6;
        }
        if (pelota.position.z + radioPelota > campoLimites.maxZ) {
            pelota.position.z = campoLimites.maxZ - radioPelota;
            pelotaVelocity.z *= -0.6;
        }
    }
    

    function detectarColision() {
        const radioPelota = 0.3; // Radio de la pelota
        const canastaSize = 1.2; // Tamaño aproximado de la canasta
    
        // Colisión con la primera canasta
        if (pelota.position.distanceTo(canasta1.position) < canastaSize) {
            pelotaVelocity.x *= -0.8; // Rebote en X
            pelotaVelocity.z *= -0.8; // Rebote en Z
        }
    
        // Colisión con la segunda canasta
        if (pelota.position.distanceTo(canasta2.position) < canastaSize) {
            pelotaVelocity.x *= -0.8;
            pelotaVelocity.z *= -0.8;
        }
    }
    
    function setupGUI() {
        const gui = new GUI();

        const lightFolder = gui.addFolder('Luz Direccional'); 
        // **Grupo de controles para la luz direccional**
        lightFolder.add(directionalLight.position, 'x', -20, 20).name('Posición X');
        lightFolder.add(directionalLight.position, 'y', 0, 50).name('Posición Y');
        lightFolder.add(directionalLight.position, 'z', -20, 20).name('Posición Z');
        lightFolder.add(directionalLight, 'intensity', 0, 2).name('Intensidad');

            // **Grupo de controles para la luz puntual**
        const pointLightFolder = gui.addFolder('Luz Puntual');
        pointLightFolder.add(puntual.position, 'x', -10, 10).name('Posición X');
        pointLightFolder.add(puntual.position, 'y', 0, 20).name('Posición Y');
        pointLightFolder.add(puntual.position, 'z', -10, 10).name('Posición Z');
        pointLightFolder.add(puntual, 'intensity', 0, 2).name('Intensidad');

        // **Grupo de controles para la luz de foco**
        const spotLightFolder = gui.addFolder('Luz Focal');
        spotLightFolder.add(focal.position, 'x', -10, 10).name('Posición X');
        spotLightFolder.add(focal.position, 'y', 0, 20).name('Posición Y');
        spotLightFolder.add(focal.position, 'z', -10, 10).name('Posición Z');
        spotLightFolder.add(focal, 'intensity', 0, 2).name('Intensidad');

        const canchaFolder = gui.addFolder('Cancha');
        const canchaColor = { color: '#ffffff' };
        canchaFolder.addColor(canchaColor, 'color').name('Color de la cancha').onChange((value) => {
            cancha.material.color.set(value);
        });

        const shadowsFolder = gui.addFolder('Sombras');
        shadowsFolder.add(renderer.shadowMap, 'enabled').name('Habilitar sombras');
        // **Mostrar todos los controles por defecto**
        lightFolder.open();
        canchaFolder.open();
        shadowsFolder.open();
    }        
    

    function updatePelota() {
        const gravedad = 0.01;  // Simulación de gravedad
        const amortiguacion = 0.06;  // Reduce la energía del rebote en Y
        const amortiguacionPared = 0.3; // 🔹 Reduce la velocidad tras rebotar en una pared
        const suelo = 0;  // Altura mínima para el rebote
    
        if (lanzando) {
            // **Modo de lanzamiento**
            pelota.position.add(pelotaVelocity);
            pelotaVelocity.y -= gravedad;  // Aplicar gravedad
    
            detectarColision(); // Detectar rebote con las canastas
            mantenerPelotaEnCampo(); // Evitar que salga del área
    
            // **Rebote en el suelo**
            if (pelota.position.y <= suelo) {
                pelota.position.y = suelo;
                pelotaVelocity.y *= -amortiguacion; // Rebote con reducción de energía
                pelotaVelocity.x *= -0.07 ;
                pelotaVelocity.z *= -0.07;
                // **Si la velocidad es demasiado baja, detener el rebote**
                if (Math.abs(pelotaVelocity.y) < 0.05) {
                    pelotaVelocity.y = 0;
                    lanzando = false; // Cambia a modo de rebote constante
                }
            }
    
            // **Rebote en las paredes (Reduce energía drásticamente)**
        } else {
            // **Modo de rebote constante**
            pelotaVelocity.y -= gravedad;  // Aplicar gravedad
            pelota.position.add(pelotaVelocity);
    
            if (pelota.position.y <= suelo) {
                pelota.position.y = suelo;
                pelotaVelocity.y *= -amortiguacion;  // Rebote en Y
    
                // **Si la energía es muy baja, darle un impulso inicial**
                if (Math.abs(pelotaVelocity.y) < 0.01) {
                    pelotaVelocity.y = 0.1;  // Reiniciar rebote
                }
            }
    
            mantenerPelotaEnCampo(); // Asegurar que no salga del área
    
            // **Movimiento manual con teclas**
            const speed = 0.1;
            if (keys["ArrowUp"] || keys["KeyW"]) {
                pelota.position.z -= speed;
                lastDirection.set(0, 0, -1); // Última dirección = adelante
            }
            if (keys["ArrowDown"] || keys["KeyS"]) {
                pelota.position.z += speed;
                lastDirection.set(0, 0, 1); // Última dirección = atrás
            }
            if (keys["ArrowLeft"] || keys["KeyA"]) {
                pelota.position.x -= speed;
                lastDirection.set(-1, 0, 0); // Última dirección = izquierda
            }
            if (keys["ArrowRight"] || keys["KeyD"]) {
                pelota.position.x += speed;
                lastDirection.set(1, 0, 0); // Última dirección = derecha
            }
    
            // **Aplicar límites para que no salga del campo**
            if (pelota.position.x < campoLimites.minX) pelota.position.x = campoLimites.minX;
            if (pelota.position.x > campoLimites.maxX) pelota.position.x = campoLimites.maxX;
            if (pelota.position.z < campoLimites.minZ) pelota.position.z = campoLimites.minZ;
            if (pelota.position.z > campoLimites.maxZ) pelota.position.z = campoLimites.maxZ;
        }
    }
    

    function render() {
        requestAnimationFrame(render);
        updatePhysics();
        updatePelota(); // Actualiza el movimiento de la pelota
        controls.update();
        renderer.render(scene, camera);
    }
