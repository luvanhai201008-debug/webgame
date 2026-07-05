const container = document.getElementById('gameCanvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050011);
scene.fog = new THREE.FogExp2(0x050011, 0.015);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// --- ÁNH SÁNG (Cần thiết để kim loại trên phi thuyền bóng bẩy) ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xff00ff, 1);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// --- 1. LƯỚI KHÔNG GIAN (MOVING GRID) ---
const gridHelper = new THREE.GridHelper(200, 100, 0x00ffff, 0xff00ff);
gridHelper.position.y = -1;
scene.add(gridHelper);

// --- 2. HỆ THỐNG HẠT NĂNG LƯỢNG ---
const particleCount = 1500;
const particlesGeo = new THREE.BufferGeometry();
const posArray = new Float32Array(particleCount * 3);
for(let i = 0; i < particleCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 100;
}
particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMat = new THREE.PointsMaterial({
    size: 0.15, color: 0x00ffff, blending: THREE.AdditiveBlending, transparent: true
});
const particleMesh = new THREE.Points(particlesGeo, particlesMat);
scene.add(particleMesh);

// --- 3. LẮP RÁP PHI THUYỀN XỊN (SPACESHIP) ---
const playerGroup = new THREE.Group();

// Vật liệu vỏ tàu (Kim loại đen bóng)
const hullMat = new THREE.MeshStandardMaterial({ 
    color: 0x222233, metalness: 0.9, roughness: 0.1 
});

// Thân chính (Hình chóp nhọn)
const bodyGeo = new THREE.ConeGeometry(0.6, 3, 16);
bodyGeo.rotateX(Math.PI / 2);
const body = new THREE.Mesh(bodyGeo, hullMat);
playerGroup.add(body);

// Cánh trái
const wingGeo = new THREE.ConeGeometry(0.8, 2, 3);
wingGeo.rotateX(Math.PI / 2);
wingGeo.rotateZ(Math.PI / 2);
const leftWing = new THREE.Mesh(wingGeo, hullMat);
leftWing.position.set(-1, 0, 0.5);
playerGroup.add(leftWing);

// Cánh phải
const rightWing = leftWing.clone();
rightWing.position.set(1, 0, 0.5);
rightWing.rotation.z = -Math.PI / 2;
playerGroup.add(rightWing);

// Động cơ phản lực (Phát sáng)
const engineGeo = new THREE.CylinderGeometry(0.3, 0.4, 0.5, 16);
engineGeo.rotateX(Math.PI / 2);
const engineMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
const engine = new THREE.Mesh(engineGeo, engineMat);
engine.position.set(0, 0, 1.5);
playerGroup.add(engine);

// Đèn ánh sáng từ động cơ
const engineLight = new THREE.PointLight(0x00ffff, 2, 8);
engineLight.position.set(0, 0, 2);
playerGroup.add(engineLight);

playerGroup.position.set(0, 0, -10);
scene.add(playerGroup);

// Gọi playerGroup là 'player' để điều khiển
const player = playerGroup; 
camera.position.set(0, 3, -3);

// --- 4. HỆ THỐNG CHƯỚNG NGẠI VẬT ---
const obstacles = [];
const obstacleGeo = new THREE.BoxGeometry(2, 2, 2); 
const obstacleMat = new THREE.MeshBasicMaterial({ color: 0xff0055, wireframe: true });

function spawnObstacle() {
    if (isGameOver) return; // Nếu thua thì không tạo nữa
    const obs = new THREE.Mesh(obstacleGeo, obstacleMat);
    // Xuất hiện ngẫu nhiên phía trước (từ x = -10 đến 10)
    const randomX = (Math.random() - 0.5) * 20; 
    obs.position.set(randomX, 0, -100); 
    scene.add(obs);
    obstacles.push(obs);
}
setInterval(spawnObstacle, 600); // 0.6s tạo 1 khối mới

// --- 5. ĐIỀU KHIỂN & VÒNG LẶP GAME ---
const keys = { w: false, a: false, s: false, d: false };
window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

let score = 0;
let isGameOver = false;
const scoreText = document.getElementById('scoreText');
const speed = 0.8; // Tốc độ chạy của không gian

function animate() {
    if (isGameOver) return; // Dừng vòng lặp nếu thua
    
    requestAnimationFrame(animate);

    // Hiệu ứng tốc độ (Grid & Particles)
    gridHelper.position.z += speed;
    if (gridHelper.position.z > 2) gridHelper.position.z = 0;

    const positions = particleMesh.geometry.attributes.position.array;
    for (let i = 2; i < particleCount * 3; i += 3) {
        positions[i] += speed * 2;
        if (positions[i] > 10) positions[i] = -100;
    }
    particleMesh.geometry.attributes.position.needsUpdate = true;

    // Điều khiển Phi thuyền (Lách trái/phải mượt mà)
    const moveSpeed = 0.4;
    if (keys.a) player.position.x -= moveSpeed;
    if (keys.d) player.position.x += moveSpeed;
    player.position.x = Math.max(-12, Math.min(12, player.position.x));

    // Hiệu ứng nghiêng tàu khi rẽ (Bank angle)
    const targetRotationZ = (keys.a ? 0.5 : 0) + (keys.d ? -0.5 : 0);
    player.rotation.z = THREE.MathUtils.lerp(player.rotation.z, targetRotationZ, 0.1);

    // Di chuyển và xử lý va chạm chướng ngại vật
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.position.z += speed * 1.5; // Tốc độ chướng ngại vật lao tới
        obs.rotation.x += 0.05;
        obs.rotation.y += 0.05;

        // Xử lý Va chạm (Khoảng cách giữa tàu và vật cản < 2)
        if (player.position.distanceTo(obs.position) < 2) {
            isGameOver = true;
            document.getElementById('hud').style.display = 'none';
            document.getElementById('gameOverScreen').style.display = 'block';
            document.getElementById('finalScore').innerText = score;
            return; 
        }

        // Xóa chướng ngại vật khi đã bay qua sau lưng
        if (obs.position.z > 5) {
            scene.remove(obs);
            obstacles.splice(i, 1);
        }
    }

    // Camera bám theo mượt mà
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, player.position.x * 0.4, 0.1);
    camera.lookAt(new THREE.Vector3(player.position.x, 0, -20));

    // Cộng điểm
    score += 1;
    scoreText.innerText = score;

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
