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

    // Variables de consenso
    let renderer, scene, camera, controls;
    let cancha, canasta1, canasta2, sky, pelota, grada1, grada2;
    let banco1, banco2, man1, man2, scoreboard;
    let mixer1;

    let pelotaVelocity = new THREE.Vector3(0, 0, 0); // Velocidad de la pelota
    let keys = {}; // Estado de las teclas
    let lanzando = false; 
    let lastDirection = new THREE.Vector3(0, 0, -1);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    const puntual = new THREE.PointLight(0xFFFFFF, 0.3);
    const focal = new THREE.SpotLight(0xFFFFFF,0.3);
    const clock = new THREE.Clock(); 

    const campoLimites = {
        minX: -4.8, // Borde izquierdo
        maxX: 4.8,  // Borde derecho
        minZ: -9,   // Línea de fondo detrás de la canasta
        maxZ: 9     // Línea de fondo detrás de la otra canasta
    };
    
    // Acciones
    init();
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
        directionalLight.castShadow = true;
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

        //animacion
        renderer.domElement.addEventListener('dblclick', animate );
        
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

        loader.load('models/scoreboard/scene.gltf', (gltf) => {
            scoreboard = gltf.scene;
            scoreboard.position.set(-14, 1, -2.2); // Ajusta la posición
            scoreboard.scale.set(0.5 ,0.5 ,0.5); // Ajusta el tamaño
            scoreboard.rotation.y = -Math.PI/2; 
            scene.add(scoreboard);
        });

        loader.load('models/man_in_suit/scene.gltf', (gltf) => {
            man2 = gltf.scene;
            man2.position.set(4.5, 0, 3); // Ajusta la posición
            man2.scale.set(0.005, 0.006, 0.005); // Ajusta el tamaño
            man2.name = "man2";
            man2.rotation.y = -Math.PI/2; 
            scene.add(man2);
            gltf.scene.traverse(ob=>{
                if(ob.isObject3D) ob.castShadow = true;
            })
           
        }, undefined, function ( error ) {
        
            console.error( error );
        
        } );

        loader.load('models/man_sitting/scene.gltf', (gltf) => {
            man1 = gltf.scene;
            man1.position.set(5, 0.15, -5.3); // Ajusta la posición
            man1.scale.set(0.35, 0.4, 0.35); // Ajusta el tamaño
            man1.name = "man1";
            man1.rotation.y = -Math.PI/2; 
            man1.castShadow = true;
            scene.add(man1);

            if (gltf.animations.length > 0) {
                mixer1 = new THREE.AnimationMixer(man1);
                const action = mixer1.clipAction(gltf.animations[0]); // Usa la primera animación
                action.play(); // Inicia la animación por defecto
            }
            gltf.scene.traverse(ob=>{
                if(ob.isObject3D) ob.castShadow = true;
            })
           
        }, undefined, function ( error ) {
        
            console.error( error );
        
        } );

        loader.load('models/old_bench/scene.gltf', (gltf) => {
            banco1 = gltf.scene;
            banco1.position.set(5, 0, -6.5); // Ajusta la posición
            banco1.scale.set(2, 2, 3); // Ajusta el tamaño
            scene.add(banco1);
            gltf.scene.traverse(ob=>{
                if(ob.isObject3D) ob.castShadow = true;
            })
        }, undefined, function ( error ) {
        
            console.error( error );
        
        } );

        loader.load('models/old_bench/scene.gltf', (gltf) => {
            banco2 = gltf.scene;
            banco2.position.set( 5, 0, 6.5); // Ajusta la posición
            banco2.scale.set(2, 2, 3); // Ajusta el tamaño
            scene.add(banco2);
            gltf.scene.traverse(ob=>{
                if(ob.isObject3D) ob.castShadow = true;
            })
           
        }, undefined, function ( error ) {
        
            console.error( error );
        
        } );

        loader.load('models/elevated_bleacher/scene.gltf', (gltf) => {
            grada1 = gltf.scene;
            grada1.position.set(-9.2, 2.25, -0.95); // Ajusta la posición
            grada1.scale.set(0.6, 0.6, 0.6); // Ajusta el tamaño
            grada1.rotation.y = Math.PI/2; 
            scene.add(grada1);
        });

        loader.load('models/elevated_bleacher/scene.gltf', (gltf) => {
            grada2 = gltf.scene;
            grada2.position.set(-9.2, 2.25, 8.2); // Ajusta la posición
            grada2.scale.set(0.6, 0.6, 0.6); // Ajusta el tamaño
            grada2.rotation.y = Math.PI/2; 
            scene.add(grada2);
        });

        loader.load('models/sky/scene.gltf', (gltf) => {
            sky = gltf.scene;
            sky.scale.set(3,3,3); // Ajusta el tamaño
            sky.position.set(0,0,0); // Ajusta la posición
            scene.add(sky);
        });
        
        // Cargar primera canasta
        loader.load("models/canasta/canasta_baloncesto_basketball_hoop/scene.gltf", (gltf) => {
            canasta1 = gltf.scene;
            canasta1.position.set(0, 0, -9);
            canasta1.scale.set(1, 1, 1);
            canasta1.castShadow = true;
            canasta1.rotation.y = Math.PI/2; 
            scene.add(canasta1);
            gltf.scene.traverse(ob=>{
                if(ob.isObject3D) ob.castShadow = true;
            })
           
        }, undefined, function ( error ) {
        
            console.error( error );
        
        } );

        loader.load("models/canasta/canasta_baloncesto_basketball_hoop/scene.gltf", (gltf) => {
            canasta2 = gltf.scene;
            canasta2.position.set(0, 0, 9);
            canasta2.scale.set(1, 1, 1.6);
            canasta2.castShadow = true;
            canasta2.rotation.y = -Math.PI/2; 
            scene.add(canasta2);
            gltf.scene.traverse(ob=>{
                if(ob.isObject3D) ob.castShadow = true;
            })
           
        }, undefined, function ( error ) {
        
            console.error( error );
        
        } );

        loader.load("models/basketball_ball/scene.gltf", (gltf) => {
            pelota = gltf.scene;
            pelota.name = "pelota";
            pelota.position.set(0, 0, 0);
            pelota.scale.set(1, 1, 1);
            pelota.castShadow = true;
            pelota.receiveShadow = true; // **Recibe sombras**
            pelota.rotation.y = -Math.PI/2; 
            scene.add(pelota);
            gltf.scene.traverse(ob=>{
                if(ob.isObject3D) ob.castShadow = true;
            })
           
        }, undefined, function ( error ) {
        
            console.error( error );
        
        } );
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

        const skyFolder = gui.addFolder('Skybox');
        skyFolder.add({ visible: true }, 'visible').name('Activar Skybox').onChange((value) => {
            if (sky) sky.visible = value;
        });

        lightFolder.open();
        canchaFolder.open();
        skyFolder.open(); 
    }        
    

    function updatePelota() {
        if (!pelota) return;
        const gravedad = 0.01;  // Simulación de gravedad
        const amortiguacion = 0.06;  // Reduce la energía del rebote en Y
        const amortiguacionPared = 0.3; //Reduce la velocidad tras rebotar en una pared
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

    function animate(event) {
        let x = (event.clientX / window.innerWidth) * 2 - 1;
        let y = -(event.clientY / window.innerHeight) * 2 + 1;
    
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
    
        // Obtener `man1` y `man2` correctamente
        const obj1 = scene.getObjectByName("man1");
        const obj2 = scene.getObjectByName("man2");
        const obj3 = scene.getObjectByName("pelota");
    
        if (!obj1 || !obj2 || !obj3) return; // Asegurar que los objetos existen
    
        const intersects1 = raycaster.intersectObject(obj1, true);
        const intersects2 = raycaster.intersectObject(obj2, true);
        const intersects3 = raycaster.intersectObject(obj3, true);
    
        if (intersects1.length > 0 && mixer1) {
            console.log(" man1 comienza a bailar");
            const action = mixer1.clipAction(mixer1._actions[0].getClip()); // Tomar animación existente
            action.reset().play(); // Reiniciar y jugar la animación
        }

        if (intersects2.length > 0) {
            new TWEEN.Tween(obj2.rotation)
                .to({ y: obj2.rotation.y + Math.PI * 2 }, 2000) // Rotación completa en 2s
                .easing(TWEEN.Easing.Quadratic.InOut)
                .start();
        }

        if (intersects3.length > 0) {
            const posPelota = obj3.position.clone();
            const posCanasta1 = canasta1.position.clone();
            const posCanasta2 = canasta2.position.clone();

            // Determinar la canasta más cercana
            const distancia1 = posPelota.distanceTo(posCanasta1);
            const distancia2 = posPelota.distanceTo(posCanasta2);

            const canastaObjetivo = distancia1 < distancia2 ? posCanasta1 : posCanasta2;

            // Calcular la trayectoria con altura intermedia
            const alturaMaxima = Math.max(posPelota.y, 3.5); // La pelota se eleva antes de caer
            const trayectoria = { x: posPelota.x, y: posPelota.y, z: posPelota.z };

            new TWEEN.Tween(trayectoria)
                .to({ x: canastaObjetivo.x, y: alturaMaxima, z: canastaObjetivo.z }, 1000) // Subida
                .easing(TWEEN.Easing.Quadratic.Out)
                .onUpdate(() => {
                    obj3.position.set(trayectoria.x, trayectoria.y, trayectoria.z);
                })
                .onComplete(() => {
                    new TWEEN.Tween(trayectoria)
                        .to({ x: canastaObjetivo.x, y: 1.2, z: canastaObjetivo.z }, 800) // Caída al aro
                        .easing(TWEEN.Easing.Quadratic.In)
                        .onUpdate(() => {
                            obj3.position.set(trayectoria.x, trayectoria.y, trayectoria.z);
                        })
                        .start();
                })
                .start();
        }
    }
    

    function render() {
        requestAnimationFrame(render);
        updatePelota(); // Actualiza el movimiento de la pelota
        controls.update();
        TWEEN.update();

        const delta = clock.getDelta(); // Obtener el tiempo entre frames
        if (mixer1) mixer1.update(delta);
        renderer.render(scene, camera);
    }
