import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
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
controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE; // Garante rotação com botão direito

camera.position.z = 5;

// --- Lógica de Carregamento e Troca de Modelos ---
const loader = new GLTFLoader();
let motoAtual;

// Função para remover a moto antiga da cena
function limparCena() {
    if (motoAtual) {
        scene.remove(motoAtual);
    }
}

// Função para carregar um novo modelo
function carregarModelo(nomeModelo) {
    limparCena();
    const caminhoModelo = `modelos/${nomeModelo}.glb`; // Assumindo que são arquivos .glb

    loader.load(caminhoModelo, (gltf) => {
        motoAtual = gltf.scene;

        // Centraliza e ajusta a escala
        const box = new THREE.Box3().setFromObject(motoAtual);
        const center = box.getCenter(new THREE.Vector3());
        motoAtual.position.sub(center);
        
        scene.add(motoAtual);

        // LINHA IMPORTANTE PARA DESCOBRIR O NOME DO MATERIAL (veja explicação abaixo)
        console.log("Estrutura do modelo carregado:", motoAtual);
    });
}

// Event listener para o menu de seleção de motos
const seletorModelo = document.getElementById('modelo');
seletorModelo.addEventListener('change', (event) => {
    carregarModelo(event.target.value);
});

// Carregar o primeiro modelo da lista ao iniciar
carregarModelo(seletorModelo.value);


// --- Lógica de Personalização ---

function mudarCorCarenagem(novaCor) {
    if (!motoAtual) return;

    motoAtual.traverse((objeto) => {
        // A condição 'if' abaixo é onde a mágica acontece.
        // Você precisa substituir 'NOME_DO_MATERIAL_AQUI' pelo nome real.
        if (objeto.isMesh && objeto.material.name === 'NOME_DO_MATERIAL_AQUI') {
            objeto.material.color.set(novaCor);
        }
    });
}

const paletaCores = document.getElementById('paleta-cores');
paletaCores.addEventListener('click', (event) => {
    if (event.target.classList.contains('cor')) {
        const cor = event.target.dataset.color;
        mudarCorCarenagem(cor);
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