# LYO (`https://longhoang-lyo.com/`) — Deep Reverse Engineering & Technical Extraction Report

Dokumen ini berisi hasil ekstraksi jaringan (setelah interaksi klik tombol **"LET'S GO"** pada DOM), pengunduhan seluruh aset 3D (`.glb`) dan tekstur (`.ktx2`, `.bin`, `.webp`), serta hasil dekompilasi kode shader TSL/Three.js asli dari bundle JavaScript produksi (`B1Nq4Kq6.js`, `CQl67Veh.js`, `BN-EMi2W.js`, `pr2JiyVy.js`).

---

## 1. Daftar Aset 3D (`.glb` / `.json`) & Tekstur (`.ktx2` / `.bin` / `.webp`) yang Diunduh

Seluruh file berikut berhasil ditangkap dari network setelah menekan tombol **"LET'S GO"** dan disimpan di `/extracted_lyo_assets/models/`, `/extracted_lyo_assets/textures/`, serta dipasang ke `/public/extracted_lyo_assets/` untuk dimuat langsung oleh `GLTFLoader` + `DRACOLoader` + `KTX2Loader`.

### A. File Model 3D (`/extracted_lyo_assets/models/` — 48 File `.glb` + 4 File Track `.json`)
1. **Robot / Tank & Proyektil:**
   - `player.glb` (41,224 bytes — `Player_Body`, `Player_Turret`, `Player_Barrel`, `Player_Cover`, `Player_Engine_1A/1B`, `Player_Track`, `Left_Wheel_01..04`, `TrackCover_Left_01..03`, `Front_Light`, `Left_Light_1A..2A`)
   - `boss.glb` (30,492 bytes — `Boss_Body`, `Boss_Turret`, `Boss_Barrel`, `Boss_Engine`, `Boss_Track_01/02`, `Boss_Light_*`)
   - `fodder.glb` (21,812 bytes — `Fodder_Body`, `Fodder_Turret`, `Fodder_Barrel`, `Fodder_Track`, `Light_1A/2A`, `Back_Light`)
   - `bullet.glb` (4,528 bytes — proyektil peluru tank)
   - `player-track.json`, `boss-track-01.json`, `boss-track-02.json`, `fodder-track.json` (kurva jalur rantai roda tank `CatmullRomCurve3`)
2. **Lingkungan, Pohon & Terrain:**
   - `floor.glb` (21,752 bytes — `terrain.001` heightfield mesh)
   - `zone.glb` (166,184 bytes — penanda zona, `player_start`, `zone_map`, `title_about`, `title_project`, `title_contact`)
   - `tree-1a.glb` (87,612 bytes — `Tree_1A.REF`, `Tree_1A.001..026`, `Tree_Foliage.010..017`)
   - `tree-1b.glb` (91,516 bytes — `Tree_1B.REF`, `Tree_1B.001..020`, `Tree_Foliage.001..009`)
3. **Properti Factory Playground & Collectible:**
   - `barricade-1a.glb`, `barrel-1c.glb`, `bench.glb`, `brick.glb`, `bridge.glb`, `bts.glb`, `chimney.glb`, `concrete-fence-1a.glb`, `concrete-fence-1b.glb`, `concrete-pipe.glb`, `contact.glb`, `crane.glb`, `debris.glb`, `dump-truck.glb`, `explosive-barrel.glb`, `forklift.glb`, `giant-pipe-1a.glb`, `giant-pipe-1b.glb`, `giant-tank.glb`, `h-beam.glb`, `hydrant.glb`, `lamppost-1a.glb`, `lamppost-1b.glb`, `metal-box-1a.glb`, `metal-box-1b.glb`, `pallet-1a.glb`, `pipe-cluster-1a.glb`, `pipe-cluster-1b.glb`, `power-core.glb`, `recycle-bin.glb`, `tank-1a.glb`, `tank-1b.glb`, `traffic-cone.glb`, `turbine.glb`, `wheelbarrow.glb`, `wooden-box.glb`
   - Collectible `.glb`: `circuit.glb`, `fuel.glb`, `gear.glb`, `tools.glb`

### B. File Tekstur & Mask (`/extracted_lyo_assets/textures/` — 40 File)
1. **Atlas & Terrain Masks (`.ktx2` & `.bin`):**
   - `game-texture.ktx2` (Atlas palet warna utama untuk seluruh model `.glb` kendaraan & properti)
   - `tree-foliage.ktx2` (Alpha mask bentuk cluster daun pohon untuk `TreeLeaves`)
   - `grass-mask.ktx2` & `grass-mask-128.bin` (Mask kepadatan rumput 128x128)
   - `soil-mask.ktx2`, `tile-mask.ktx2`, `soil.ktx2`, `tile.ktx2` (Mask dan tekstur tanah/ubin jalan)
   - `map-light.ktx2`, `locked-thumb.ktx2`
2. **Tekstur VFX Partikel (`.ktx2`):**
   - `track-mark.ktx2`, `debris.ktx2`, `decal-01.ktx2`, `decal-02.ktx2`, `flash.ktx2`, `ring.ktx2`, `smoke.ktx2`, `sphere.ktx2`, `star-01.ktx2`, `star-02.ktx2`, `star-burst.ktx2`, `stunned-effect.ktx2`
3. **Tekstur UI & Karakter (`.webp`):**
   - `player-left-active.webp`, `player-right-inactive.webp`, `fodder-right-active.webp`, `art-mail-desktop.webp`, `art-mail-mobile.webp`, `circuit.webp`, `fuel.webp`, `gear.webp`, `map-light.webp`, `map.webp`, `toolbox.webp`, `tools.webp`, `00-thumbnail.webp`..`05-phase-1-discover.webp`

---

## 2. Bedah Kode Asli: Grass / Wind Shader (`class Ni` di `B1Nq4Kq6.js`)

### A. Konfigurasi `InstancedMesh` & Geometri Bilah Rumput
Diambil langsung dari `Ni.prototype.initMetrics` dan `Ni.prototype.initNearMesh` (`B1Nq4Kq6.js:389600–396500`):

- **Ukuran Grid & Jumlah Instance:**
  - `chunkSize = 6.4` (High Quality) / `8.0` (Low/Touch)
  - `poolRadiusChunks = 2` -> `poolDiameterChunks = 5` (`5 x 5 = 25` chunk)
  - `chunkColumns = 64`, `chunkRows = 40` -> `nearBladesPerChunk = 2560`
  - `maxNearInstances = 25 * 2560 = 64,000` kandidat titik, disaring dengan `bladeKeepRatio = 0.407` menggunakan hash deterministik `getPlacementSeed(col, row, 0, 11)` sehingga menghasilkan **~26.048 bilah rumput (`InfiniteGrass`)** di dalam `fieldSize = 32.0m x 32.0m` yang melakukan *toroidal wrapping* (`mod(anchor - viewPos + fieldSize*0.5, fieldSize)`) mengikuti kamera!
  - Ditambah `InfiniteGrassPetals` (`maxPetalInstances = 2000`, `petalCount = 200`, `petalSize = 0.12`, `petalHeight = 0.5`, `petalBaseLift = 0.1`).
- **Dimensi & Geometri Bilah Rumput (`initBladeGeometry`):**
  - `bladeRows = 3`, `bladeColumns = 2` (3 segitiga: 2 untuk badan bilah bawah, 1 meruncing di ujung atas).
  - `bladeWidth = 0.185`, `bladeHeight = 0.8`, `bladeFold = 0.5`, `bladeTipWidth = 1.0`.
  - `nearScaleMin = 0.2`, `nearScaleMax = 1.4`.
- **Atribut InstancedBufferAttribute:**
  - `aLocalAnchor` (`vec2`): Posisi `(x, z)` di dalam `fieldSize` dengan `wrappedJitterFactor = 0.45`.
  - `aRandom` (`vec2`): `(rand0, rand1)` per bilah untuk variasi warna, kelengkungan, dan fase angin.
  - `aBladeShape` (`vec4`): `[heightScale, widthScale, cos(angle), sin(angle)]`.

### B. Palet Warna Uniform Rumput & Bunga (`B1Nq4Kq6.js:389700`)
```js
this.sunRoot = new THREE.Color('#1b6e1e');
this.sunMid = new THREE.Color('#75d424');
this.sunTip = new THREE.Color('#d1f542');
this.shadowRoot = new THREE.Color('#083d12');
this.shadowMid = new THREE.Color('#1a7a24');
this.shadowTip = new THREE.Color('#57b825');
this.petalYellowA = new THREE.Color('#fff04a');
this.petalYellowB = new THREE.Color('#ffb300');
this.petalPurpleA = new THREE.Color('#b366ff');
this.petalPurpleB = new THREE.Color('#8033cc');
this.floorBlend = 0.65;
this.trailDarkening = 0.8;
this.noiseScale = 0.18;
```

### C. Rumus Gelombang Angin & Interaksi Jejak Tank (`getWindOffset` & `initNearPosition`)
```js
// Dual-scrolling Perlin Wind Noise Texture (128x128) + Sinusoidal Gust
getWindOffset(worldPos, randSeed) {
  const dir = normalize(uWindDirection + vec2(1e-4));
  const perp = vec2(-dir.y, dir.x);
  const uv1 = worldPos.xz * 0.01125 + dir * (uWindPhase * 0.0175);
  const uv2 = worldPos.xz * 0.034375 - dir * (uWindPhase * 0.02975);
  const n1 = clamp(texture(windNoiseTex, uv1).r, 0.0, 1.0);
  const n2 = texture(windNoiseTex, uv2).r - 0.5;
  const freq = mix(0.75, 1.35, randSeed);
  const flutter = sin(uWindPhase * freq + randSeed * 6.2831853) * 0.08;
  const gust = 1.0 + uWindGust * 1.15;
  const forwardPush = (n1 * 0.42 + 0.24 + flutter) * uWindStrength * gust;
  const sidePush = (n2 * 0.28 + flutter * 0.75) * uWindStrength * gust;
  return dir * forwardPush + perp * sidePush;
}
```
- **Deformasi Vertex Bilah:**
  - `heightFrac = clamp(position.y, 0, 1)`, `curve = heightFrac * heightFrac`.
  - Lipatan tengah bilah (`bladeFold = 0.5`) membentuk profil V-shape 3D sehingga bilah rumput tetap bervolume dari segala sudut kamera.
  - Saat karakter/tank mendekat (`dist < uRobotRadius * 3.0`), bilah rumput terdorong menjauh secara radial (`radialDir * (1.0 - smoothstep(r, 3r, dist)) * uBendStrength * 0.6`) dan menggelap di sepanjang `trailTexture` (`uTrailDarkening = 0.8`).

---

## 3. Bedah Kode Asli: Foliage / Tree Shader (`class Li` / `TreeLeaves` di `B1Nq4Kq6.js`)

Diambil langsung dari `Li` (`B1Nq4Kq6.js:432500–438500`) dan `Ri.prototype.instanceObjectOverrides` (`B1Nq4Kq6.js:442500`):

- **Struktur Model `.glb` Pohon (`tree-1a.glb` & `tree-1b.glb`):**
  - Mesh batang pohon (`Tree_1A.REF` / `Tree_1B.REF`) memiliki child kosong/marker bernama `Tree_Foliage.001` s/d `Tree_Foliage.017` di ujung-ujung dahan.
  - Konfigurasi warna asli:
    - **`Tree_1A` (Kuning Emas):** `colorA: '#eab308'`, `colorB: '#facc15'`, `leafScale: 2.2`
    - **`Tree_1B` (Biru-Ungu Tua Khas Lyo):** `colorA: '#5e57a5'`, `colorB: '#775cf6'`, `leafScale: 2.2`
- **Algoritma Cluster Kartu Daun (`initGeometry`):**
  - Setiap marker `Tree_Foliage` dibuatkan 1 instance dari gabungan **`planesPerCluster = 80`** buah `PlaneGeometry(0.8, 0.8)`.
  - Posisi pusat tiap kartu (`aLeafCenter`) disebar di dalam bola berjari-jari `r = 1.0 - Math.pow(random(), 3)` dengan koordinat bola acak, dan normal vertex di-lerp ke arah radial bola (`normalLerp = 0.85`) agar gradasi pencahayaan tampak membulat seperti kanopi kartun!
- **Shader Vertex Billboard + Angin (`initPositionNode`):**
  - Setiap kartu daun (`aLeafLocalPos * uLeafScale`) di-rotasi 2D sebesar `aLeafPlaneSeed * 2π`, lalu disejajarkan ke matriks view kamera (`camRight * u + camUp * d + camForward * depthOffset`) ditambah goyangan angin (`windSwayScale = 0.46`, `windGustPush = 0.28`, `windLiftScale = 0.1`).
- **Shader Fragment (`initFragmentColor` & `initFragmentAlpha`):**
  - Alpha mask diambil dari tekstur **`/assets/terrain/tree-foliage.ktx2`** (`alphaThreshold = 0.3`, `alphaSoftness = 0.01`, `alphaTest = 0.5`).
  - Warna diinterpolasi antara `uColorA` dan `uColorB` menggunakan `smoothstep(0, 1, dot(vNormal, lightDirection))`, lalu diproses oleh `WorldMaterial` (`Yn`) yang menambahkan efek *halftone dots* dan *cross-hatching* pada sisi bayangan!

---

## 4. Bedah Kode Asli: Tank Controller, Kamera, Pencahayaan & Outline

### A. Kamera & Follow-Cam (`CQl67Veh.js:1–12000`)
- **Frustum & Sudut Kamera:**
  - `new THREE.PerspectiveCamera(35, aspect, 0.1, 1000)` (`fov = 35°`).
  - Offset arah kamera default: `angle.items.default = new THREE.Vector3(4, 14, 8)` (vektor arah `normalize(4, 14, 8)`).
  - Jarak zoom: `zoom = { minDistance: 9, amplitude: 12, value: 0.6 }` -> jarak kamera default `9 + 12 * 0.6 = 16.2` meter di sepanjang vektor `(4, 14, 8)`.
- **Critical-Damped Spring Follow:**
  - `tau = lerp(0.18, 0.22, boostRatio)`, `omega = 2.0 / tau`, `exp = Math.exp(-omega * dt)`.
  - Jika jarak target > `6m` (`distanceToSquared > 36`), kamera langsung snap ke target.
- **Recoil Kamera Saat Menembak:**
  - `recoilKickDistance = 0.13`, `maxRecoilDistance = 0.37`.

### B. Pencahayaan, Fog & Halftone/Cel-Shading (`Oi`, `Di`, `Ai`, `Yn` di `B1Nq4Kq6.js`)
- **Pencahayaan Utama (`Oi` & `Di.presetConfig.day`):**
  - Arah matahari spherical: `phi = 0.63`, `theta = 0.72`, `radius = 50`.
  - Preset Siang (`day`): `lightColor = '#ffe6b1'`, `lightIntensity = 1.0`, `shadowColor = '#454778'`, `fogColorA = '#00a2ff'`, `fogColorB = '#f1ff64'`, `revealColor = '#5f7df7'`, `revealIntensity = 12`.
  - Parameter Toon/Cel-Shading (`Yn`):
    - `uShadowStep = 0.15`, `uHighlightStep = 0.60`, `uShadowColor = '#2a2b36'`.
    - `bounceColor = '#82487f'`, `lightBounceDistance = 1.5`, `lightBounceMultiplier = 0.4` (memantulkan warna tanah `#b6966c` atau rumput `#75d424` ke permukaan bawah objek dekat tanah menggunakan grid halftone `Jn(screenUV, 180, bounceFactor)`).
    - **Halftone & Cross-Hatching Shadow (`Jn` & `qn`):** Pada area bayangan (`coreShadow` + `dropShadow`), shader menggabungkan grid titik halftone 45° (`scale = 180`) dan garis arsiran *hatching* (`freq = 204`) lalu mencampurnya ke warna bayangan `baseColor * uShadowColor`.

### C. Hard Ink Outline (`Nn` / `StrokeManager` di `B1Nq4Kq6.js:1500–5600, 461000–464000`)
- Menggunakan teknik **Back-Face Inverted Hull (`side: THREE.BackSide`)** dengan geometri yang telah di-merge vertex-nya (`mergeVertices(geom, 1e-4)`) dan dihitung ulang `computeVertexNormals()` agar sudut-sudut tajam tidak pecah saat diekstrusi:
  ```glsl
  float clampedDepth = min(-viewPos.z, uStrokeMaxDepth);
  float distFade = 1.0 - smoothstep(80.0, 150.0, length(cameraPosition - worldPos));
  vec3 extrudedPos = position + normal * (uStrokeWidth * noiseMod * distFade / instanceScale) * clampedDepth;
  ```

---

## 5. Bedah REA: Game Collision & Physics (`BN-EMi2W.js`, `cr`, `Ri`, `Ui`, `Wi`, `Gi` di `B1Nq4Kq6.js`)

**Bukti REA (Evidence IDs):**
- Supporting Modules Bundle (`18` file termasuk `BN-EMi2W.js` & `CQl67Veh.js`): `ev_85d6197173073e46d6381edadd4c53fdd3327565ff26ce2dc61b7a0cf8125fb9` (Summary View: `ev_050a8bfb7cf3c91db277993f69e1afb1d950e3dc3c4d62a69b7728ffc67927b8`)
- Core Engine Bundle (`B1Nq4Kq6.js`, `250,669` AST nodes): `ev_daaaadfdb296ab29c1a8e4ea5ec17f41b58d63ff3559495dd8b3a59990b8fdba` (Summary View: `ev_77c7c4071569a5f76827428e91486a6074680a0f13af51860c1ccce2b2990b83`)

### A. Konvensi Penamaan Node Collider di Dalam `.glb` (`BN-EMi2W.js:l,f,p` & `cr.getPhysicsTemplate`)
- Setiap model `.glb` di `https://longhoang-lyo.com/` menyimpan child mesh collider tersembunyi (`visible = false`, `castShadow = false`, `receiveShadow = false`) yang diparse otomatis saat inisialisasi Rapier3D:
  - **Shape (`l(name)`):**
    - Nama mengandung `cuboid`, `cube`, atau `floor_fixed` -> `ColliderDesc.cuboid(hx, hy, hz)`
    - Nama mengandung `cylinder` -> `ColliderDesc.cylinder(hy, radius)`
    - Nama mengandung `cone` -> `ColliderDesc.cone(hy, radius)`
  - **Body Type (`f(name)`):**
    - Nama mengandung `dynamic` -> `RigidBodyDesc.dynamic()`
    - Nama mengandung `kinematic` -> `RigidBodyDesc.kinematicPositionBased()`
    - Nama mengandung `fixed` (atau default) -> `RigidBodyDesc.fixed()`

### B. Bitmask Collision Group Rapier3D (`cr.COLLISION_GROUPS` @ `B1Nq4Kq6.js:110000`)
- Timestep fisika: `fixedTimeStep = 1 / 60` (`maxPhysicsStepsPerFrame = 5`), gravitasi `{ x: 0, y: -9.81, z: 0 }`, dengan interpolasi visual `lerpVectors(prevPos, pos, alpha)` & `slerpQuaternions(prevRot, rot, alpha)`.
- Bitmask grup (`membership << 16 | filter`):
  - `DEFAULT = 1` (`0x01`), `FLOOR = 2` (`0x02`), `PLAYER = 4` (`0x04`), `DYNAMIC = 8` (`0x08`), `TRIGGER = 16` (`0x10`), `ENEMY = 32` (`0x20`).
- **Player RigidBody (`cr.initRobotBody`):**
  - `RigidBodyDesc.dynamic()`, `linearDamping = 0.5`, `angularDamping = 0.8`, `lockRotations(true, false, true)` (mengunci pitch X & roll Z di solver fisika agar kemiringan bodi dikendalikan murni oleh animasi pegas/recoil, sementara yaw Y bebas), `ccdEnabled = true`.
  - `ColliderDesc.cuboid(hx, hy, hz)`, `restitution = 0.4`, `friction = 0.3`, `activeEvents = COLLISION_EVENTS`.
- **Enemy RigidBody (`cr.initEnemyBody`):**
  - `RigidBodyDesc.dynamic()`, `linearDamping = 0.8`, `angularDamping = 0.8`, `dominanceGroup = 1`.
  - `ColliderDesc.roundCuboid(hx - 0.08, hy - 0.08, hz - 0.08, 0.08)`.

### C. Respons Pantulan & Spin Saat Robot Menabrak Objek Statis (`cr.handleRobotCollision` @ `B1Nq4Kq6.js:119400`)
- Aktif ketika kecepatan horizontal sebelum step `speed = preStepRobotVelocity.length() >= 0.3` dan robot tidak sedang melompat/memanjat (`!isAirborne && !isObjectSupportActive && !isClimbing`).
- Normal pantulan horizontal: `m = normalize((robotPos - colliderPos).setY(0))`.
- Jika `velDir.dot(m) < -0.05`:
  1. **Impuls Pantulan Balik (Push-Back):**
     - `pushBackMultiplier = 0.35`
     - `impulse = m * (speed * 0.35 * robotMass)` (diterapkan pada sumbu X dan Z).
  2. **Defleksi Putaran Sudut (Angular Spin):**
     - `angularMultiplier = 0.30`
     - `angDeltaY = cross(velDir, m).y * speed * 0.30`, ditambahkan langsung ke `angvel.y`.
  3. **Event Benturan (`robot:collision`, throttle `90ms`):**
     - Memicu guncangan bodi `handleHitReaction(normal)` sekaligus suara benturan material `Na.handleRobotCollision`.

### D. Tabel `shootImpulse`, `materialTag`, & Transisi `fixed -> dynamic` (`Ri`, `Wi`, `Gi` @ `B1Nq4Kq6.js:441572..533792`)
| Objek / Prop (`.glb`) | `materialTag` | `shootImpulse` | Parameter Fisika Khusus |
| :--- | :--- | :--- | :--- |
| Default Dynamic Props (`RecycleBin`, `TrafficCone`) | `plastic` | `4` | `linearDamping: 0.6`, `angularDamping: 0.8` |
| `Barrel_1C`, `MetalBox_1A`, `MetalBox_1B` | `metal` | `5` | `shootImpulse: 5` |
| `Box_1A`, `WoddenBox` | `wood` | `5` | `shootImpulse: 5` |
| `Brick` | `brick` | `5` | `density: 14`, `shootImpulse: 5` |
| `BTS` | `metal` | `6` | `shootImpulse: 6` |
| `Pallete_1A` | `wood` | `6` | `shootImpulse: 6` |
| `WheelBarrow`, `Bench` | `metal` / `wood` | `10` | `shootImpulse: 10` |
| `ConcreteFence_1A` (`Gi`) | `concrete` | `32` | `role: 'blockWall'`, `density: 0.9, friction: 0.8, restitution: 0.05`. Mulai sebagai `fixed`, berubah menjadi `dynamic` saat terkena ledakan/tembakan lalu mengecil & hilang (`shrinkDuration = 2.0s`) setelah tenang selama `0.5s` (atau maks `5.0s`). |
| `ConcretePipe` (`Wi`) | `concrete` | `4` | Mulai sebagai `fixed` (`sleep: true`), berubah menjadi `dynamic` (`linearDamping: 0.6, angularDamping: 1.5, friction: 0.5, restitution: 0.1`) saat terkena ledakan dalam radius `explosionRadius * 1.5` (`12m`). |
| `ExplosiveBarrel` (`Wi`) | `metal` | `0` | `role: 'explosive'`, `explosionCenterOffset: 0.75`, meledak setelah `explosionDelay = 200ms` (chain reaction `100..300ms` dalam radius `8m`). |

### E. Rumus Impuls Radial Ledakan (`BN-EMi2W.js:g` / `qt` & `Wi` @ `B1Nq4Kq6.js:513248`)
- Parameter `ExplosiveBarrelManager` (`Wi`):
  - `explosionRadius = 8`, `chainTriggerRadius = 8`, `damageRadius = 6`, `explosionForce = 10`
  - `explosionDamagePlayer = 6`, `explosionDamageEnemy = 6`, `explosionStunDuration = 1.5`
  - Skala gaya per objek: `brickExplosionForceScale = 0.1`, `concreteFenceExplosionForceScale = 0.6`, `dynamicObjectForceScale = 0.8`.
- Untuk setiap rigid body dinamis dalam jarak `dist < radius`:
  ```js
  const strength = (1 - dist / radius) * maxImpulse;
  const dir = bodyPos.sub(explosionOrigin).add(new Vector3(0, 0.5, 0)).normalize();
  body.applyImpulse(dir.multiplyScalar(strength), true);
  body.applyTorqueImpulse({
    x: (Math.random() - 0.5) * strength * 0.3,
    y: (Math.random() - 0.5) * strength * 0.3,
    z: (Math.random() - 0.5) * strength * 0.3,
  }, true);
  ```

---

## 6. Bedah REA: Sistem Particle Ledakan (`zr`, `Kr`, `qr()`, `Jr()`, `Yr`, `Xr`, `xi`, `Si` di `B1Nq4Kq6.js`)

Diambil dari `B1Nq4Kq6.js:157007–178500` dan `B1Nq4Kq6.js:310817–334028` (Evidence ID: `ev_daaaadfdb296ab29c1a8e4ea5ec17f41b58d63ff3559495dd8b3a59990b8fdba`):

### A. 10 Tekstur KTX2 VFX (`zr` @ `B1Nq4Kq6.js:157007`)
- `flare`: `/assets/vfx/flash.ktx2`
- `circle`: `/assets/vfx/ring.ktx2`
- `fire`: `/assets/vfx/debris.ktx2` (atlas flipbook `2x2`)
- `smoke`: `/assets/vfx/smoke.ktx2`
- `decalHot`: `/assets/vfx/decal-02.ktx2`
- `decalDark`: `/assets/vfx/decal-01.ktx2`
- `hardball`: `/assets/vfx/sphere.ktx2`
- `startburst`: `/assets/vfx/star-01.ktx2`
- `starBurst`: `/assets/vfx/star-burst.ktx2`
- `starAlt`: `/assets/vfx/star-02.ktx2`

### B. Komposisi 12 Layer Partikel `BarrelCompositeExplosion` (`Kr` @ `B1Nq4Kq6.js:157395`)
Skala global: `effectScale = 2`, `positionScale = 0.22`, `velocityScale = 0.12`, `sizeScale = 0.22`, `duration = 3.5s`:
1. **`SphereFlash`**: Tekstur `sphere.ktx2`, `lifetime = 0.6s`, `startSize = 18`, `blending = AdditiveBlending`, kurva ukuran turun tajam dari `1.0 -> 0.0`.
2. **`Circle Area`**: Tekstur `ring.ktx2`, `lifetime = 0.4s`, `startSize = 17`, `alignToGround = true`, cincin gelombang kejut di tanah (`scale 0 -> 1`).
3. **`Fire Floaters`**: Tekstur `debris.ktx2` (`2x2` sheet), `lifetime = [0.5, 2.2]s`, `startSpeed = [6, 12]`, `startSize = [1, 3]`, `gravity = 1.6`, 2 burst (`15` partikel pada `t = 0s`, `20` partikel pada `t = 0.1s`) dari emitter bola `radius = 2.5`.
4. **`Inner Fire`**: Tekstur `debris.ktx2` (`2x2` sheet), `delay = 0.1s`, `lifetime = [0.1, 0.4]s`, `startSpeed = [4, 15]`, `startSize = [3, 6]`, 4 burst beruntun (`12, 8, 6, 5` partikel pada `t = 0.0, 0.1, 0.2, 0.3s`).
5. **`Flarespikes`**: Tekstur `flash.ktx2`, `delay = 0.1s`, `lifetime = 0.6s`, `startSize = [8, 12]`, `renderMode = 'flarePyramid'` (mesh piramida terbalik 10 sisi yang memancarkan duri cahaya).
6. **`Circular Smoke`**: Tekstur `smoke.ktx2`, `delay = 0.05s`, `lifetime = [0.6, 2.0]s`, `startSpeed = [15, 25]`, `startSize = [2.5, 6]`, burst `50` partikel menyebar melingkar di tanah (`circle` emitter `r = 2.5`).
7. **`Explosion Lamp`**: Tekstur `flash.ktx2`, `lifetime = 0.25s`, `startSize = 16`, `renderMode = 'softFlash'`.
8. **`Decal Heated Strike`**: Tekstur `decal-02.ktx2`, `delay = 0.05s`, `lifetime = 2.5s`, `startSize = 2.8`, kawah panas membara (`AdditiveBlending`, `groundOffset = 0.03`).
9. **`Decal`**: Tekstur `decal-01.ktx2`, `lifetime = 3.0s`, `startSize = 7.5`, bekas gosong hitam `#111111` di tanah (`NormalBlending`, `groundOffset = 0.02`).
10. **`Firey Debris`**: Tekstur `debris.ktx2` (`2x2`), `lifetime = [0.5, 1.0]s`, `startSpeed = [25, 35]`, `startSize = [0.5, 1.3]`, `count = [2, 5]` serpihan terlempar cepat.
11. **`Smoke`**: Tekstur `smoke.ktx2`, `delay = 0.05s`, `lifetime = [0.5, 0.8]s`, `startSpeed = [9, 15]`, `startSize = [4, 7]`, 4 burst (`4, 4, 2, 2` partikel).
12. **`Smoke Up`**: Tekstur `smoke.ktx2`, `delay = 0.05s`, `lifetime = [1.2, 2.0]s`, `startSpeed = [4, 15]`, `startSize = [3, 6]`, `gravity = -2.5` (asap membubung ke atas dalam 3 jari-jari kerucut, `count = 23`).

### C. Varian Warna Ledakan Karakter (`qr()`, `Jr()`, `Yr`, `Xr`, `Si`)
- **Ledakan Tong (`spawnBarrelExplosion` / `Kr`):** Palet Oranye-Merah Api (`#fff3b0 -> #ff9e2c -> #ff4b1f -> #3b170e`).
- **Ledakan Kematian Boss & Player (`qr()` / `Yr`):** Palet Ungu Neon (`colorGradientPurple`: `#f9ecff -> #d896ff -> #9b4dff -> #2d0c4e`), `sizeScale = 0.33` untuk Boss dan `0.24` untuk Player.
- **Ledakan Kematian Fodder (`Jr()` / `Xr`):** Palet Merah-Oranye (`colorGradientRed`: `#fff0d6 -> #ff7a3d -> #e02424 -> #450a0a`), menyaring keluar layer asap tebal (`Circular Smoke`, `Smoke`, `Smoke Up`) agar ledakan robot kecil tetap bersih dan responsif (`sizeScale = 0.20`).
- **Asap Kerusakan Kritis (`ei` & `Ti` @ `B1Nq4Kq6.js:178500, 342000`):** Aktif otomatis saat `hp / maxHp <= 0.33`, menyemburkan `3..5` partikel asap (`#e8e2d8` -> `#aaa199`, `rise = 1.33..2.66m`, `lifetime = 0.67..0.93s`).

---

## 7. Bedah REA: Shooting System (`ci`, `ai`, `oi`, `si`, `lr`, `ur`, `$r`, `Zr`, `Qr` di `B1Nq4Kq6.js`)

Diambil dari `B1Nq4Kq6.js:130128–250346` (Evidence ID: `ev_daaaadfdb296ab29c1a8e4ea5ec17f41b58d63ff3559495dd8b3a59990b8fdba`):

### A. Parameter Senjata & Burst Upgrade (`ci` @ `B1Nq4Kq6.js:228877`)
- **Player (`ci`):**
  - `fireRate = 0.2s` (cooldown antar klik/tembakan)
  - `projectileSpeed = 55`, `projectileLife = 1.0s`, `projectileSpread = 0.05 rad`
  - **Sistem Burst Gear Upgrade:** Jumlah peluru per tembakan adalah `totalShots = 1 + collectedGears` dengan jeda beruntun `shotInterval = 0.08s`. Saat `collectedGears >= 3`, tipe visual proyektil dan muzzle flash otomatis naik kelas dari `DEFAULT` (Hijau) menjadi `BOSS` (Ungu)!
- **Enemy (`oi`, `ya`, `xa`):**
  - **Fodder:** `shootRange = 7m`, `shootCooldown = 0.5s` (desktop) / `1.0s` (mobile), `projectileSpeed = 30` (desktop) / `20` (mobile), `emergencyBurst = 2` tembakan (`fodderBurstInterval = 0.09s`) saat player terlalu dekat (`< 3.0m`).
  - **Boss:** `shootRange = 9m`, `volleySize = 5` peluru (desktop) / `4` (mobile), `windupDuration = 1.0s` (memutar `Boss_Engine` sebesar `6π rad` selama `3s`), `shotInterval = 0.10s`, `reloadDuration = 1.5s` (desktop) / `2.0s` (mobile).

### B. Visual Proyektil (`/model/robot/bullet.glb`), PointLight & Ribbon Trail (`ai` @ `B1Nq4Kq6.js:189405`)
- Menggunakan 3 mesh dari `bullet.glb`:
  - `Bullet_Player` (`bullet01`): Hijau `#00ff66` (`pointLightColor: 65382`, `distance: 6`)
  - `Bullet_Boss` (`bullet02`): Ungu `#a855f7` (`pointLightColor: 11032055`, `distance: 6`)
  - `Bullet_Fodder` (`bullet03`): Merah/Oranye `#ef4444` (`pointLightColor: 15680580`, `distance: 6`)
- Setiap peluru dilapisi outline hitam inverted-hull (`strokeWidth = 0.018`, `strokeColor = '#17110f'`) dan diikuti **Ribbon Trail** (`trailLengthRatio = 2.3`, `trailGrowDuration = 0.02s`) menggunakan tekstur kanvas gradasi `64x16` (`AdditiveBlending`).

### C. Muzzle Flash 4-Komponen (`$r` Player, `Zr` Boss, `Qr` Fodder @ `B1Nq4Kq6.js:174737`)
Setiap tembakan memunculkan efek kilatan moncong berdurasi `0.25s`–`0.30s` yang terdiri dari:
1. **Core Glow (`flash.ktx2`):** Inner & outer billboard glow (`#ffff00` + `#32ff00` untuk Player; `#ffffff` + `#8f6cff` untuk Boss; `#fff56d` + `#76ff49` untuk Fodder).
2. **Shockwave Ring (`ring.ktx2`):** Cincin mengembang di moncong meriam.
3. **Forward Smoke Cone (`smoke.ktx2`):** `3` kepulan asap terdorong maju (`forward: [0.35, 1.45]m`).
4. **Directional Sparks (`sphere.ktx2`):** `4` percikan api cepat untuk Player/Fodder dan `7` percikan untuk Boss.

### D. Animasi Recoil 4-Bagian Saat Menembak (`ci.fireSingleShot` & `ya.handleRecoil`)
Saat Player menembak, 4 animasi pegas berjalan serempak:
1. **Camera Kick:** Kamera mundur `recoilKickDistance = 0.13` (maks `0.37`).
2. **Turret Slide & Pitch:** Turret mundur `recoilDistance = 0.16` (`0.05s` `sine.out`, kembali `0.22s` `power2.out`), terangkat `turretLiftAmount = 0.06`, dan mendongak `turretRotateAngle = 6°`.
3. **Barrel Slide:** Laras meriam mundur `barrelRecoilDistance = 0.16` (`0.05s` mundur, `0.22s` kembali).
4. **Hull Body Kick:** Bodi tank terangkat `bodyLiftAmount = 0.05` dan miring `bodyRotateAngle = 12°` berlawanan arah tembakan (`0.05s` `power2.out`, kembali `0.25s` `power3.out`).
- Pada musuh (`ya.handleRecoil`), turret mundur `0.08m` dan barrel mundur `0.13m` (`0.05s` `power2.out`, kembali `0.40s` `power3.out`).

---

## 8. Bedah REA: Suara Benturan Terhadap Benda & Audio Spatial (`Da`, `ka`, `Na` di `B1Nq4Kq6.js`)

Diambil dari `B1Nq4Kq6.js:771500–814533` (Evidence ID: `ev_daaaadfdb296ab29c1a8e4ea5ec17f41b58d63ff3559495dd8b3a59990b8fdba`):

### A. Pemetaan `materialTag` ke File Audio SFX (`Da` @ `B1Nq4Kq6.js:771500`)
| `materialTag` | Sound ID | File Audio (`.mp3`) | `baseVolume` | Pitch `jitter` | `throttleMs` |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `plastic` | `hit-plastic` | `/audio/sfx/hit-plastic.mp3` | `0.60` | `0.10` | `220ms` |
| `metal` | `hit-metal` | `/audio/sfx/hit-metal.mp3` | `0.40` | `0.10` | `220ms` |
| `wood` | `hit-wood` | `/audio/sfx/hit-wood.mp3` | `0.33` | `0.10` | `220ms` |
| `brick` | `hit-brick-01`, `hit-brick-02` | `/audio/sfx/hit-brick-01.mp3`, `02.mp3` | `0.50` | `0.10` | `90ms` |
| `concrete` | `hit-concrete` | `/audio/sfx/hit-concrete.mp3` | `0.60` | `0.10` | `220ms` |
| `default` | `hit-generic` | `/audio/sfx/hit-generic.mp3` | `0.55` | `0.10` | `220ms` |

### B. Rumus Volume Benturan Robot & Peluru (`Na.handleRobotCollision` & `Na.handleBulletHit`)
- **Saat Robot Menabrak Objek (`Na.handleRobotCollision`):**
  - Ambang kecepatan minimum: `speed >= 0.2` untuk `brick`, dan `speed >= 0.3` untuk material lainnya.
  - Skala volume dinamis terhadap kecepatan tabrakan:
    ```js
    const minVol = isBrick ? 0.45 : 0.25;
    const maxSpeed = isBrick ? 6.0 : 12.0;
    const volumeScale = THREE.MathUtils.clamp(speed / maxSpeed, minVol, 1.0);
    ```
- **Saat Peluru Mengenai Objek (`Na.handleBulletHit`):**
  - Mencari `materialTag` dengan menelusuri hierarki `object -> parent` (`userData.materialTag`, `userData.role`, atau `instanceObject.materialTags[meshName]`), lalu memutar suara material terkait dengan `{ position, throttleMs: 40, jitter: 0.12 }`.
- **Saat Peluru Mengenai Karakter:**
  - Mengenai Musuh (`enemy:hit`): memutar `/audio/sfx/fodder-hit.mp3` (`baseVolume: 0.35`, `jitter: 0.08`, `throttleMs: 55`).
  - Mengenai Player (`player:hit-reaction`): memutar `/audio/sfx/player-hit.mp3` (`baseVolume: 0.45`, `jitter: 0.06`, `throttleMs: 80`).

### C. Spatial Attenuation & Multi-Explosion Ducking (`ka` & `Na.playExplosion`)
- ** Kurva Jarak Spatial (`ka.getDistanceGain`):**
  - `refDistance = 8m`, `maxDistance = 58m`, `rolloff = 1.6`, `minGain = 0.03`:
    - Untuk `dist <= 8m`: `gain = 1.0`
    - Untuk `dist >= 58m`: `gain = 0.03`
    - Di antaranya: `gain = 0.03 + 0.97 * Math.pow(1 - (dist - 8) / 50, 1.6)`
- **Multi-Explosion Ducking & Compressor (`Na.playExplosion`):**
  - Menghitung jumlah ledakan beruntun dalam jendela `350ms` terakhir:
    - Ledakan ke-1: `1.00x` volume
    - Ledakan ke-2: `0.85x` volume
    - Ledakan ke-3: `0.72x` volume
    - Ledakan ke-4+: `0.60x` volume
  - Pitch jitter meningkat `0.08 + min(count * 0.03, 0.12)` dan seluruh output SFX melewati `DynamicsCompressorNode` (`threshold: -1.5 dB, knee: 3, ratio: 20, attack: 0.003s, release: 0.1s`) agar ledakan berantai tidak pernah clipping.

---

## 9. Bedah REA: Animasi Saat Terkena Ledakan atau Tembakan (`ir`, `ya`, `Ci`, `Ti`, `yi`, `bi` di `B1Nq4Kq6.js`)

Diambil dari `B1Nq4Kq6.js:40549–63433`, `300792–307500`, `334028–348640`, dan `695000–730000` (Evidence ID: `ev_daaaadfdb296ab29c1a8e4ea5ec17f41b58d63ff3559495dd8b3a59990b8fdba`):

### A. Animasi Guncangan Bodi Saat Terkena Tembakan/Tabrakan (`ir.handleHitReaction` & `ya.handleHitReaction`)
- Vektor arah tembakan/benturan `direction` ditransformasikan ke ruang lokal bodi:
  ```js
  const localDir = direction.clone().applyQuaternion(bodyWorldQuat.invert());
  ```
- **Pada Player (`ir.handleHitReaction` @ `B1Nq4Kq6.js:40549`):**
  - Bodi melompat naik `+0.05m` dan miring sebesar `maxTilt = 12°` (`rotX = +localDir.z * 12°`, `rotZ = -localDir.x * 12°`) dalam `0.10s` (`power2.out`), lalu kembali ke posisi normal dalam `0.50s` (`power3.out`).
- **Pada Enemy (`ya.handleHitReaction` @ `B1Nq4Kq6.js:696500`):**
  - Bodi melompat naik `+0.10m` dan miring lebih dramatis sebesar `maxTilt = 30°` (`rotX = +localDir.z * 30°`, `rotZ = -localDir.x * 30°`) dalam `0.10s` (`power2.out`), lalu pulih dalam `0.50s` (`power3.out`).

### B. Emissive Hit Flash Kuning Terang (`Ci` / `EnemyHitFlashSystem` @ `B1Nq4Kq6.js:334028`)
- Saat musuh terkena peluru (`enemy:hit`), seluruh material permukaan pada `enemy.mesh` diberikan warna emissive kuning menyala:
  - `flashColor = '#ffff00'`
  - `maxEmissive = 6.0`
  - `flashDuration = 0.15s`
  - Kurva peluruhan kuadratik per frame:
    ```js
    const t = elapsed / 0.15;
    const intensity = (1 - t * t) * 6.0;
    ```

### C. Partikel Semburan Pecahan Saat Peluru Mengenai Bodi (`yi` `EnemyHit` & `bi` `PlayerHit` @ `B1Nq4Kq6.js:300792`)
- Berdurasi `0.15s` tepat di titik impak peluru:
  - **Core Glow (`flash.ktx2`):** `#fff6cc` + `#ffbe55` (`EnemyHit`) atau `#ffb570` (`PlayerHit`).
  - **Shockwave Ring (`ring.ktx2`):** Mengembang dari `0.14m -> 1.15m` (`EnemyHit`) / `1.22m` (`PlayerHit`).
  - **Starburst (`star-burst.ktx2`):** Bintang impak tajam (`scale 0.18 -> 1.28`).
  - **Flying Shards (`sphere.ktx2`):** `9` serpihan cahaya (`#fff8dd`, `#ffd77a`, `#ffb24c`) terpental ke segala arah (`speed = 2.0..4.9 m/s`, `drag = 0.9`).

### D. Animasi Pusing / Stunned Saat Terkena Ledakan Tong (`ir.initStunEffect` & `xa.initStunEffect`)
- Ledakan `ExplosiveBarrel` dalam `damageRadius = 6m` memberikan `6` damage, melontarkan bodi dengan impuls radial, dan memicu **Stun** selama `explosionStunDuration = 1.5s` (`player.stun(1.5)` / `enemy.freeze(1.5)`).
- Selama `1.5s` terkena stun:
  - Memutar loop audio `/audio/sfx/stunned.mp3` (`baseVolume: 0.32`).
  - Memunculkan plane horizontal `1.5m x 1.5m` di atas kepala robot (`y = +1.6m` pada Player, `y = +1.3m` pada Enemy) dengan tekstur `/assets/vfx/stunned-effect.ktx2` berwarna kuning neon `#ffe600` (`multiplyScalar(3)`).
  - Plane bintang pusing membesar `scale: 0 -> 1` dalam `0.25s` dengan easing `back.out(1.5)`, berputar **2 putaran penuh** (`rotation.z = progress * 4π`), lalu mengecil kembali `scale: 1 -> 0` pada `0.25s` terakhir (`power2.in`).

