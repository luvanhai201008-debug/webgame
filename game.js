const container = document.getElementById('gameCanvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050011);
scene.fog = new THREE.FogExp2(0x050011, 0.015);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Chống lag cho màn hình độ phân giải quá cao
container.appendChild(renderer.domElement);

// --- 1. LƯỚI KHÔNG GIAN (MOVING GRID) TẠO CẢM GIÁC TỐC ĐỘ ---
const gridHelper = new THREE.GridHelper(200, 100, 0xff00ff, 0x00ffff);
gridHelper.position.y = -1;
scene.add(gridHelper);

// --- 2. HỆ THỐNG HẠT (PARTICLES) SIÊU ĐẸP, KHÔNG LAG ---
const particleCount = 2000;
const particlesGeo = new THREE.BufferGeometry();
const posArray = new Float32Array(particleCount * 3);

for(let i = 0; i < particleCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 100; // Phân tán ngẫu nhiên
}
particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

// Dùng AdditiveBlending để các hạt sáng rực lên khi xếp chồng
const particlesMat = new THREE.PointsMaterial({
    size: 0.2,
    color: 0x00ffff,
    blending: THREE.AdditiveBlending, 
    transparent: true
});
const particleMesh = new THREE.Points(particlesGeo, particlesMat);
scene.add(particleMesh);

// --- 3. PHI THUYỀN (PLAYER) MỚI ---
// Đổi sang khối Tetrahedron sắc sảo hơn
const playerGeo = new THREE.TetrahedronGeometry(1.2, 0); 
const playerMat = new THREE.MeshBasicMaterial({ 
    color: 0xffffff, 
    wireframe: true // Dạng khung lưới cực ngầu
});
const player = new THREE.Mesh(playerGeo, playerMat);
player.position.set(0, 0, -10);
scene.add(player);

// Thêm lõi phát sáng bên trong
const coreGeo = new THREE.TetrahedronGeometry(0.8, 0);
const coreMat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
const core = new THREE.Mesh(coreGeo, coreMat);
player.add(core);

camera.position.set(0, 3, -2);

// --- 4. ĐIỀU KHIỂN & HIỆU ỨNG TỐC ĐỘ ---
const keys = { w: false, a: false, s: false, d: false };
window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

let score = 0;
const scoreText = document.getElementById('scoreText');
let speed = 0.5; // Tốc độ di chuyển của lưới và hạt

function animate() {
    requestAnimationFrame(animate);

    // Di chuyển lưới để tạo cảm giác xe đang lao đi
    gridHelper.position.z += speed;
    if (gridHelper.position.z > 2) gridHelper.position.z = 0;

    // Di chuyển các hạt bụi năng lượng bay vào mặt
    const positions = particleMesh.geometry.attributes.position.array;
    for (let i = 2; i < particleCount * 3; i += 3) {
        positions[i] += speed * 2;
        if (positions[i] > 10) { // Nếu hạt bay qua camera, đưa nó ra xa lại
            positions[i] = -50;
        }
    }
    particleMesh.geometry.attributes.position.needsUpdate = true;

    // Điều khiển Phi thuyền
    const moveSpeed = 0.3;
    if (keys.a) player.position.x -= moveSpeed;
    if (keys.d) player.position.x += moveSpeed;
    
    // Giới hạn đường đua
    player.position.x = Math.max(-15, Math.min(15, player.position.x));

    // Xoay phi thuyền liên tục để tạo vẻ đẹp cơ khí
    player.rotation.z += 0.05;
    player.rotation.x += 0.02;

    // Camera bám theo mượt mà
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, player.position.x * 0.5, 0.05);
    camera.lookAt(new THREE.Vector3(player.position.x, 0, -20));

    // Tính điểm
    score += 1;
    scoreText.innerText = score;

    renderer.render(scene, camera);
}

// Xử lý Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
