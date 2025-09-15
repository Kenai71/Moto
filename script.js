import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- ESTRUTURA DE DADOS DAS MOTOS ---
// IMPORTANTE: Verifique se os nomes dos arquivos .glb estão corretos!
const motos = {
    "Suzuki": {
        "GSX-750": {
            path: 'models/suzuki_gsx750.glb', // Caminho para o seu modelo 3D
            scale: 1, // Ajuste a escala se necessário
        }
    },
    "Aprilia": {
        "RSV4": {
            path: 'models/aprilia_rsv4.glb',
            scale: 1,
        }
    }
};

// --- VARIÁVEIS GLOBAIS ---
let scene, camera, renderer, controls;
let raycaster, mouse;
let motoAtual = null;
let pecaSelecionada = null;

// --- ELEMENTOS DA INTERFACE ---
const marcaSelect = document.getElementById('marca-select');
const modeloSelect = document.getElementById('modelo-select');
const coresContainer = document.getElementById('cores-container');

// --- INICIALIZAÇÃO ---
function init() {
    // Cena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    // Câmera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 3);

    // Renderer
    const container = document.getElementById('container-3d');
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping; // Melhora a qualidade das cores
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    // Controles de Órbita
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Luzes
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Raycaster para detectar cliques
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Eventos
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('click', onMouseClick);
    setupUI();

    // Inicia o loop de animação
    animate();
}

// --- LÓGICA DA INTERFACE (UI) ---
function setupUI() {
    // Popula o seletor de marcas
    for (const marca in motos) {
        const option = document.createElement('option');
        option.value = marca;
        option.textContent = marca;
        marcaSelect.appendChild(option);
    }

    // Evento para mudança de marca
    marcaSelect.addEventListener('change', () => {
        const marca = marcaSelect.value;
        modeloSelect.innerHTML = '<option value="">-- Selecione --</option>';
        if (marca && motos[marca]) {
            for (const modelo in motos[marca]) {
                const option = document.createElement('option');
                option.value = modelo;
                option.textContent = modelo;
                modeloSelect.appendChild(option);
            }
        }
    });

    // Evento para mudança de modelo
    modeloSelect.addEventListener('change', () => {
        const marca = marcaSelect.value;
        const modelo = modeloSelect.value;
        if (marca && modelo && motos[marca][modelo]) {
            carregarModelo3D(motos[marca][modelo]);
        }
    });
    
    // Evento para os botões de cor
    coresContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('cor-box')) {
            const novaCor = event.target.dataset.color;
            trocarCor(novaCor);
        }
    });
}

// --- LÓGICA 3D ---
function carregarModelo3D(modeloInfo) {
    if (motoAtual) {
        scene.remove(motoAtual);
    }

    const loader = new GLTFLoader();
    loader.load(modeloInfo.path, (gltf) => {
        motoAtual = gltf.scene;
        motoAtual.scale.set(modeloInfo.scale, modeloInfo.scale, modeloInfo.scale);
        scene.add(motoAtual);
        console.log("Modelo carregado:", modeloInfo.path);
    }, undefined, (error) => {
        console.error("Erro ao carregar o modelo:", error);
    });
}

function onMouseClick(event) {
    // Ignora cliques no painel da UI
    if (event.clientX > window.innerWidth - 340) {
        return;
    }
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    if (motoAtual) {
        const intersects = raycaster.intersectObjects(motoAtual.children, true);
        if (intersects.length > 0) {
            pecaSelecionada = intersects[0].object;
            console.log("Peça selecionada:", pecaSelecionada.name);
            // Adicione um feedback visual se quiser (ex: um contorno)
        } else {
            pecaSelecionada = null;
        }
    }
}

function trocarCor(novaCorHex) {
    if (pecaSelecionada && pecaSelecionada.material) {
        // Clona o material para não afetar outras peças que possam usá-lo
        const novoMaterial = pecaSelecionada.material.clone();
        novoMaterial.color.set(novaCorHex);
        pecaSelecionada.material = novoMaterial;
        console.log(`Cor da peça '${pecaSelecionada.name}' alterada para ${novaCorHex}`);
    } else {
        alert("Selecione uma peça da moto primeiro!");
    }
}

// --- FUNÇÕES DE AJUSTE E ANIMAÇÃO ---
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Necessário se enableDamping for true
    renderer.render(scene, camera);
}

// --- INICIAR APLICAÇÃO ---
init();