import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; // Caminho corrigido
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- Configuração Básica ---
const container = document.getElementById('container3d');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// --- Iluminação ---
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// --- Controles da Câmera ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;

camera.position.z = 5;

// --- Lógica de Carregamento e Troca de Modelos ---
const loader = new GLTFLoader();
let motoAtual;

// Raycaster e Mouse
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let objetosSelecionados = [];

function limparCena() {
    if (motoAtual) {
        scene.remove(motoAtual);
    }
}

function carregarModelo(nomeModelo) {
    limparCena();
    objetosSelecionados = [];
    const caminhoModelo = `modelos/${nomeModelo}.glb`;

    loader.load(caminhoModelo, (gltf) => {
        motoAtual = gltf.scene;
        const box = new THREE.Box3().setFromObject(motoAtual);
        const center = box.getCenter(new THREE.Vector3());
        motoAtual.position.sub(center);
        scene.add(motoAtual);
    });
}

const seletorModelo = document.getElementById('modelo');
seletorModelo.addEventListener('change', (event) => {
    carregarModelo(event.target.value);
});

carregarModelo(seletorModelo.value);

// Variável para armazenar a cor original de cada objeto selecionado
let coresOriginais = new Map();

// --- Lógica para Pré-visualização e Aplicação da Cor ---
const paletaCores = document.getElementById('paleta-cores');

paletaCores.addEventListener('mousedown', (event) => {
    if (objetosSelecionados.length === 0) return;

    objetosSelecionados.forEach(obj => {
        if (!coresOriginais.has(obj.uuid)) {
            coresOriginais.set(obj.uuid, obj.material.color.clone());
        }
    });
});

paletaCores.addEventListener('mousemove', (event) => {
    if (event.buttons !== 1) return;

    if (objetosSelecionados.length > 0) {
        if (event.target.classList.contains('cor')) {
            const novaCor = event.target.dataset.color;
            objetosSelecionados.forEach(obj => {
                obj.material.color.set(novaCor);
            });
        }
    }
});

paletaCores.addEventListener('mouseup', (event) => {
    if (objetosSelecionados.length > 0) {
        if (event.target.classList.contains('cor')) {
            const cor = event.target.dataset.color;
            objetosSelecionados.forEach((objeto) => {
                objeto.material.color.set(cor);
                objeto.material.emissive.set(0x000000);
            });
            objetosSelecionados = [];
            coresOriginais.clear();
        }
    }
});

// --- Lógica de Clique e Drag para Seleção ---
let mouseStart = new THREE.Vector2();

container.addEventListener('mousedown', (event) => {
    mouseStart.x = event.clientX;
    mouseStart.y = event.clientY;
});

container.addEventListener('mouseup', (event) => {
    const dragThreshold = 5;
    if (Math.abs(event.clientX - mouseStart.x) > dragThreshold || Math.abs(event.clientY - mouseStart.y) > dragThreshold) {
        return;
    }

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    if (!motoAtual) return;

    const intersects = raycaster.intersectObjects(motoAtual.children, true);
    
    if (intersects.length === 0) {
        objetosSelecionados.forEach(obj => {
            obj.material.emissive.set(0x000000);
        });
        objetosSelecionados = [];
        return;
    }

    const objetoClicado = intersects[0].object;
    if (objetoClicado.isMesh) {
        const index = objetosSelecionados.indexOf(objetoClicado);
        if (index === -1) {
            objetosSelecionados.push(objetoClicado);
            console.log("Objeto adicionado:", objetoClicado.name);
            objetoClicado.material.emissive.set(0x555555);
        } else {
            objetosSelecionados.splice(index, 1);
            console.log("Objeto removido:", objetoClicado.name);
            objetoClicado.material.emissive.set(0x000000);
        }
    }
});

// --- Loop de Animação e Responsividade ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});