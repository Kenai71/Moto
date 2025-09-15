import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

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

function carregarModelo(nomeArquivo) {
    limparCena();
    objetosSelecionados = [];

    const caminhoCompleto = `modelos/${nomeArquivo}`;
    const extensao = nomeArquivo.split('.').pop().toLowerCase();
    
    let loader;

    switch (extensao) {
        case 'glb':
            loader = new GLTFLoader();
            break;
        case 'obj':
            loader = new OBJLoader();
            break;
        case 'fbx':
            loader = new FBXLoader();
            break;
        default:
            console.error(`Carregador não encontrado para a extensão: ${extensao}`);
            return;
    }

    loader.load(caminhoCompleto, (objetoCarregado) => {
        motoAtual = objetoCarregado.scene || objetoCarregado; 

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

// --- Lógica para Aplicação da Cor (AGORA COM PRÉ-VISUALIZAÇÃO) ---
const seletorCor = document.getElementById('seletor-cor');

seletorCor.addEventListener('input', (event) => {
    if (objetosSelecionados.length > 0) {
        const novaCor = event.target.value;
        objetosSelecionados.forEach(obj => {
            if (obj.material) {
                // Remove o destaque emissivo para mostrar a cor pura
                obj.material.emissive.set(0x000000); 
                obj.material.color.set(novaCor);
            }
        });
    }
});

// --- Lógica de Clique para Seleção ---
container.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    if (!motoAtual) return;

    const intersects = raycaster.intersectObjects(motoAtual.children, true);
    
    // Limpa a seleção se clicar em um local sem objetos
    if (intersects.length === 0) {
        objetosSelecionados.forEach(obj => {
            if (obj.material) {
                obj.material.emissive.set(0x000000);
            }
        });
        objetosSelecionados = [];
        return;
    }

    const objetoClicado = intersects[0].object;

    // Apenas mexe com objetos do tipo Mesh
    if (objetoClicado.isMesh) {
        const index = objetosSelecionados.indexOf(objetoClicado);
        if (index === -1) {
            // Adiciona objeto à seleção e aplica emissão para destaque
            objetosSelecionados.push(objetoClicado);
            if (objetoClicado.material) {
                objetoClicado.material.emissive.set(0x555555);
            }
            console.log("Objeto adicionado:", objetoClicado.name);
        } else {
            // Remove objeto da seleção e remove a emissão
            objetosSelecionados.splice(index, 1);
            if (objetoClicado.material) {
                objetoClicado.material.emissive.set(0x000000);
            }
            console.log("Objeto removido:", objetoClicado.name);
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