import React, { useState, Suspense, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Center, useProgress, Html, ContactShadows, Environment, Float } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

// --- 1. 樣式定義 (新增 Select 下拉選單樣式) ---
const styles = {
  container: {
    width: '100vw', height: '100vh', backgroundColor: '#f0f2f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    overflow: 'hidden', position: 'relative',
  },
  navBar: {
    position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    width: '90%', maxWidth: '800px', padding: '16px 24px', borderRadius: '24px',
    background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
  },
  logoGroup: { display: 'flex', alignItems: 'center', gap: '12px' },
  logoIcon: {
    width: '36px', height: '36px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white', fontSize: '18px', fontWeight: 'bold',
  },
  logoText: { fontSize: '18px', fontWeight: '800', color: '#1e293b', letterSpacing: '-0.5px' },

  // 左側控制面板
  sidebar: {
    position: 'absolute', left: '32px', top: '120px', zIndex: 10,
    background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(20px)',
    padding: '24px', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.8)',
    display: 'flex', flexDirection: 'column', gap: '20px', width: '240px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)', maxHeight: 'calc(100vh - 160px)', overflowY: 'auto'
  },
  sidebarSection: { display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '16px', borderBottom: '1px solid rgba(0,0,0,0.05)' },
  sidebarTitle: { fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' },
  rangeInput: { width: '100%', cursor: 'pointer', accentColor: '#6366f1' },
  // 新增：Select 樣式
  selectInput: {
    width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.8)',
    background: 'rgba(255,255,255,0.5)', color: '#334155', fontSize: '13px', fontWeight: '600',
    outline: 'none', cursor: 'pointer', appearance: 'none',
    backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236366f1%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px top 50%', backgroundSize: '10px auto',
  },
  numberBadge: {
    background: 'white', padding: '2px 8px', borderRadius: '6px',
    fontSize: '12px', fontWeight: '700', color: '#6366f1',
    boxShadow: '0 2px 4px rgba(99, 102, 241, 0.1)', minWidth: '20px', textAlign: 'center'
  },

  bottomCard: {
    position: 'absolute', bottom: '32px', right: '32px', zIndex: 10,
    background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(16px)',
    padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.5)',
    display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none',
  },
  instructionText: { fontSize: '11px', color: '#64748b', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' },
  dot: { width: '6px', height: '6px', borderRadius: '50%' },
  dimensionBadge: {
    background: 'rgba(99, 102, 241, 0.9)', color: 'white', padding: '6px 12px',
    borderRadius: '8px', fontSize: '12px', fontWeight: '700', pointerEvents: 'none',
  },
  controlsGroup: {
    display: 'flex', alignItems: 'center', gap: '20px',
    background: 'rgba(255, 255, 255, 0.5)', padding: '8px 20px',
    borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.6)',
  },
  alertBadge: {
    position: 'absolute', top: '100px', left: '50%', transform: 'translateX(-50%)',
    zIndex: 20, background: 'rgba(239, 68, 68, 0.9)', color: 'white',
    padding: '12px 24px', borderRadius: '16px', fontWeight: '800', fontSize: '14px',
    boxShadow: '0 8px 24px rgba(239, 68, 68, 0.3)', backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)', animation: 'shake 0.5s ease-in-out',
  },
  controlItem: { display: 'flex', alignItems: 'center', gap: '8px' },
  label: { fontSize: '16px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b' },
  colorInput: { width: '20px', height: '20px', border: '2px solid white', borderRadius: '50%', cursor: 'pointer' },
  toggleContainer: { width: '32px', height: '18px', borderRadius: '10px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' },
  toggleCircle: { width: '12px', height: '12px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', transition: 'left 0.3s' }
};

function Loader() {
  const { progress } = useProgress();
  return <Html center><div style={{ color: '#6366f1', fontWeight: 'bold' }}>{Math.round(progress)}%</div></Html>;
}

// --- CAD Line (保持不變) ---
function CADLine({ start, end, offset, axis, label, color }) {
  const points = useMemo(() => {
    const dir = new THREE.Vector3();
    if (axis === 'x') dir.set(0, 0, 1); if (axis === 'y') dir.set(1, 0, 0); if (axis === 'z') dir.set(1, 0, 0);
    const extStart = start.clone().add(dir.clone().multiplyScalar(offset));
    const extEnd = end.clone().add(dir.clone().multiplyScalar(offset));
    return { ext1: [start, extStart], ext2: [end, extEnd], main: [extStart, extEnd], label: extStart.clone().add(extEnd).multiplyScalar(0.5) };
  }, [start, end, offset, axis]);
  return (
    <group>
      <line><bufferGeometry attach="geometry" onUpdate={g => g.setFromPoints(points.ext1)} /><lineBasicMaterial color="#cbd5e1" transparent opacity={0.5} /></line>
      <line><bufferGeometry attach="geometry" onUpdate={g => g.setFromPoints(points.ext2)} /><lineBasicMaterial color="#cbd5e1" transparent opacity={0.5} /></line>
      <line><bufferGeometry attach="geometry" onUpdate={g => g.setFromPoints(points.main)} /><lineBasicMaterial color={color} linewidth={2} /></line>
      <Html position={points.label} center><div style={{ color: color, fontSize: '10px', fontWeight: '900', background: 'white', padding: '2px 4px', borderRadius: '4px', border: `1px solid ${color}` }}>{label}</div></Html>
    </group>
  );
}

// --- 自動尺寸標註 (保持不變) ---
function AssemblyDimensions({ show, showLines, versionTrigger }) {
  const { scene } = useThree();
  const [bbox, setBbox] = useState(null);
  useEffect(() => {
    if (!show) return;
    const updateBox = () => {
      const box = new THREE.Box3();
      let hasMesh = false;
      scene.traverse((obj) => {
        if (obj.isMesh && obj.userData.isPart && obj.visible) {
          obj.updateWorldMatrix(true, true);
          box.union(new THREE.Box3().setFromObject(obj));
          hasMesh = true;
        }
      });
      if (hasMesh) {
        const size = new THREE.Vector3(); box.getSize(size);
        const center = new THREE.Vector3(); box.getCenter(center);
        setBbox({ min: box.min.clone(), max: box.max.clone(), size, center });
      }
    };
    const timer = setTimeout(updateBox, 100);
    return () => clearTimeout(timer);
  }, [scene, show, versionTrigger]); // versionTrigger 用於強制更新

  if (!show || !bbox) return null;
  const { min, max, size, center } = bbox;
  const gap = 30;
  return (
    <group>
      <Html position={[center.x, max.y + 20, center.z]} center distanceFactor={150}>
        <div
          style={{
            ...styles.dimensionBadge,
            width: '260px',
            textAlign: 'center'
          }}
        >
          整體尺寸：{size.x.toFixed(1)} × {size.y.toFixed(1)} × {size.z.toFixed(1)} mm
        </div>
      </Html>

      {showLines && (
        <group>
          <CADLine start={new THREE.Vector3(min.x, min.y, max.z)} end={new THREE.Vector3(max.x, min.y, max.z)} offset={gap} axis="x" label={size.x.toFixed(1)} color="#6366f1" />
          <CADLine start={new THREE.Vector3(max.x, min.y, min.z)} end={new THREE.Vector3(max.x, max.y, min.z)} offset={gap} axis="y" label={size.y.toFixed(1)} color="#10b981" />
          <CADLine start={new THREE.Vector3(max.x, min.y, min.z)} end={new THREE.Vector3(max.x, min.y, max.z)} offset={gap} axis="z" label={size.z.toFixed(1)} color="#f43f5e" />
          <primitive object={new THREE.Box3Helper(new THREE.Box3(min, max), 'rgba(203, 213, 225, 0.4)')} />
        </group>
      )}
    </group>
  );
}

// --- 模型元件 ---
// 新增 type 屬性來幫助識別是哪種零件，以便回傳尺寸
function Model({ url, color, opacity, position = [0, 0, 0], type, onLoaded }) {
  const geom = useLoader(STLLoader, url);
  useMemo(() => {
    if (!geom) return;

    geom.computeVertexNormals();
    geom.computeBoundingBox();

    const box = geom.boundingBox;

    const centerX = (box.max.x + box.min.x) / 2;
    const centerZ = (box.max.z + box.min.z) / 2;
    const minY = box.min.y;
    const minZ = box.min.z;

    // XZ 置中，Y 貼地
    geom.translate(-centerX, -minY, -minZ);

    if (onLoaded && box) {
      const width = box.max.x - box.min.x;
      onLoaded(type, width);
    }
  }, [geom, onLoaded, type]);

  return (
    <group position={position}>
      <mesh
        geometry={geom}
        castShadow
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        userData={{ isPart: true }}
      >
        <meshPhysicalMaterial
          color={color}
          transparent={opacity < 1}
          opacity={opacity}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}

export default function App() {
  // --- 狀態管理 ---
  // 1. 檔案路徑選擇 (Part 1 & 4)
  const [part1File, setPart1File] = useState('Right brush head 0.stl');
  const [part4File, setPart4File] = useState('left brush head 0.stl');

  // 2. 數量控制 (Part 2 & 3)
  const [qty2, setQty2] = useState(2);
  const [qty3, setQty3] = useState(1);

  // 3. 全局設定
  const [gap, setGap] = useState(0);
  const [globalColor, setGlobalColor] = useState('#6366f1');
  const [showDimensions, setShowDimensions] = useState(true);
  const [showLines, setShowLines] = useState(true);

  // 4. 尺寸紀錄 (用於計算排列)
  const [widths, setWidths] = useState({ p1: 0, p2: 0, p3: 0, p4: 0 });

  // 處理模型載入後的尺寸回報
  const handleModelLoaded = (type, width) => {
    setWidths(prev => {
      if (prev[type] === width) return prev; // 避免重複渲染
      return { ...prev, [type]: width };
    });
  };

  // --- 核心排列邏輯 ---
  const models = useMemo(() => {
    // 建立序列：P1 -> [P2...] -> [P3...] -> P4
    // 這裡我們只產生 "設定檔"，包含 id, url, 和它對應的寬度 key
    const sequence = [
      { id: 'p1-head', url: part1File, type: 'p1' },
      ...Array(qty2).fill(0).map((_, i) => ({ id: `p2-${i}`, url: 'Charging slot.stl', type: 'p2' })),
      ...Array(qty3).fill(0).map((_, i) => ({ id: `p3-${i}`, url: 'toothbrush holder.stl', type: 'p3' })),
      { id: 'p4-tail', url: part4File, type: 'p4' }
    ];

    // 計算每個物件的 X 座標
    let currentX = 0;
    const positioned = sequence.map((item, index) => {
      const w = widths[item.type] || 20; // 預設寬度防呆

      // 計算該物件的中心點位置
      // 公式: 上一個結束點 + (自己的一半) + 間距
      // 這裡簡化為：累加器紀錄當前 "右邊緣"，新物件中心 = 右邊緣 + 間距 + 半寬
      if (index === 0) currentX = 0; // 第一個物件起點
      else {
        const prevItem = sequence[index - 1];
        const prevW = widths[prevItem.type] || 20;
        // 移動游標：從上一個的中心，往右移動半個上寬 + 間距 + 半個本寬
        currentX += (prevW / 2) + gap + (w / 2);
      }

      return { ...item, position: [currentX, 0, 0] };
    });

    // 偏移所有物件，使其整體置中
    // 總長度大約是最後一個物件的 pos.x - 第一個物件的 pos.x
    if (positioned.length > 0) {
      const firstX = positioned[0].position[0];
      const lastX = positioned[positioned.length - 1].position[0];
      const centerOffset = (firstX + lastX) / 2;

      return positioned.map(m => ({
        ...m,
        position: [m.position[0] - centerOffset, 0, 0]
      }));
    }

    return positioned;
  }, [part1File, part4File, qty2, qty3, gap, widths]);
  // 在 App 元件內，models 的 useMemo 之後加入這段計算
  const totalSizeInfo = useMemo(() => {
    // X 軸長度：各個模型載入寬度的總和
    const totalX = models.length > 0 ?
      (widths.p1 + (qty2 * widths.p2) + (qty3 * widths.p3) + widths.p4 + (models.length - 1) * gap) : 0;

    // Z 軸寬度：通常取所有模型中最寬的那一個（此處以 3D 深度為準）
    // 假設您的模型深度固定，或是您想從 widths 擴展偵測 depth
    const totalZ = 80; // 這邊暫定 80mm，您可以根據 STL 實際測量調整

    // 判斷是否超過限制：X325 或 Y320 (三維空間中的 Y 通常對應平面寬度)
    const isOver = totalX > 325 || totalZ > 320;

    return { totalX, totalZ, isOver };
  }, [models, widths, qty2, qty3, gap]);
  return (
    <div style={styles.container}>
      {/* 尺寸超限警示 */}
      {totalSizeInfo.isOver && (
        <div style={styles.alertBadge}>
          ⚠️ 尺寸超出列印範圍！當前長度：{totalSizeInfo.totalX.toFixed(1)} mm (上限 325mm)
          <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(-50%); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-52%); }
            20%, 40%, 60%, 80% { transform: translateX(-48%); }
          }
        `}</style>
        </div>
      )}
      <nav style={styles.navBar}>
        <div style={styles.logoGroup}>
          <div style={styles.logoIcon}>0</div>
          <div style={styles.logoText}>參數牙刷架<span style={{ color: '#7f7f9aff' }}>Oral-B</span></div>
        </div>
        <div style={styles.controlsGroup}>
          <div style={styles.controlItem}><span style={styles.label}>顏色選擇</span><input type="color" value={globalColor} onChange={(e) => setGlobalColor(e.target.value)} style={styles.colorInput} /></div>
          <div style={styles.controlItem}><span style={styles.label}>尺寸顯示</span>
            <div onClick={() => setShowDimensions(!showDimensions)} style={{ ...styles.toggleContainer, background: showDimensions ? '#6366f1' : '#cbd5e1' }}><div style={{ ...styles.toggleCircle, left: showDimensions ? '17px' : '3px' }}></div></div>
          </div>
          <div style={styles.controlItem}><span style={styles.label}>標注線顯示</span>
            <div onClick={() => setShowLines(!showLines)} style={{ ...styles.toggleContainer, background: showLines ? '#8b5cf6' : '#cbd5e1' }}><div style={{ ...styles.toggleCircle, left: showLines ? '17px' : '3px' }}></div></div>
          </div>
        </div>
        <div style={{ width: '100px' }}></div>
      </nav>
      {/* --- 左側控制面板 --- */}
      <div style={styles.sidebar}>
        {/* Part 1 設定 */}
        <div style={styles.sidebarSection}>
          <span style={styles.sidebarTitle}>右側刷頭</span>
          <select style={styles.selectInput} value={part1File} onChange={(e) => setPart1File(e.target.value)}>

            <option value="Right brush head 0.stl">無刷頭</option>
            <option value="Right brush head 1.stl">一刷頭(EB款式)</option>
            <option value="Right brush head 2.stl">二刷頭(EB款式)</option>
            <option value="Right brush head 3.stl">三刷頭(EB款式)</option>
            <option value="R-IO-1.stl">一刷頭(IO款式)</option>
            <option value="R-IO-2.stl">二刷頭(IO款式)</option>
          </select>
        </div>

        {/* Part 2 數量 */}
        <div style={styles.sidebarSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={styles.sidebarTitle}>充電器插槽數量</span>
            <div style={styles.numberBadge}>{qty2}</div>
          </div>
          <input type="range" min="0" max="10" step="1" value={qty2} onChange={(e) => setQty2(Number(e.target.value))} style={styles.rangeInput} />
        </div>

        {/* Part 3 數量 */}
        <div style={styles.sidebarSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={styles.sidebarTitle}>牙刷架數量</span>
            <div style={styles.numberBadge}>{qty3}</div>
          </div>
          <input type="range" min="0" max="10" step="1" value={qty3} onChange={(e) => setQty3(Number(e.target.value))} style={styles.rangeInput} />
        </div>

        {/* Part 4 設定 */}
        <div style={styles.sidebarSection}>
          <span style={styles.sidebarTitle}>左側刷頭</span>
          <select style={styles.selectInput} value={part4File} onChange={(e) => setPart4File(e.target.value)}>
            <option value="left brush head 0.stl">無刷頭</option>
            <option value="left brush head 1.stl">一刷頭(EB款式)</option>
            <option value="left brush head 2.stl">二刷頭(EB款式)</option>
            <option value="left brush head 3.stl">三刷頭(EB款式)</option>
            <option value="L-IO-1.stl">一刷頭(IO款式)</option>
            <option value="L-IO-2.stl">二刷頭(IO款式)</option>
          </select>
        </div>

        {/* 全局間距 */}
        {/* <div style={{ ...styles.sidebarSection, borderBottom: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={styles.sidebarTitle}>Spacing (mm)</span>
            <div style={{ ...styles.numberBadge, background: '#f1f5f9', color: '#64748b', boxShadow: 'none' }}>{gap}</div>
          </div>
          <input type="range" min="0" max="50" step="1" value={gap} onChange={(e) => setGap(Number(e.target.value))} style={styles.rangeInput} />
        </div> */}
      </div>

      <Canvas shadows dpr={[1, 2]} camera={{ position: [100, 150, 200], fov: 40 }}>
        <Suspense fallback={<Loader />}>
          <Environment preset="city" />
          <ambientLight intensity={0.5} />
          <pointLight position={[100, 100, 100]} castShadow />
          {/* <gridHelper args={[300, 30, '#e5e7eb', '#f1f5f9']} /> */}


          {/* <Float speed={1} rotationIntensity={0.05} floatIntensity={0.2}> */}
          <group>
            {models.map((m) => (
              <Model
                key={m.id}
                url={m.url}
                type={m.type}
                color={globalColor}
                opacity={1}
                position={m.position}
                onLoaded={handleModelLoaded}
              />
            ))}
          </group>
          {/* </Float> */}

          {/* 傳入 models.length 作為 trigger，當數量改變時強制重算框框 */}
          <AssemblyDimensions show={showDimensions} showLines={showLines} versionTrigger={models.length + gap + part1File + part4File} />
          <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={300} blur={2.5} far={100} />
        </Suspense>
        <OrbitControls makeDefault minDistance={50} maxDistance={1000} enableDamping />
      </Canvas>

      <div style={styles.bottomCard}>
        <div style={{ ...styles.label, marginBottom: '8px', color: '#6366f1', fontSize: '12px' }}>
          操作說明
        </div>

        <div style={styles.instructionText}>
          <span style={{ ...styles.dot, background: '#6366f1' }}></span>
          左鍵旋轉：查看 3D 模型細節
        </div>

        <div style={styles.instructionText}>
          <span style={{ ...styles.dot, background: '#10b981' }}></span>
          右鍵平移：移動畫布位置
        </div>

        <div style={styles.instructionText}>
          <span style={{ ...styles.dot, background: '#f43f5e' }}></span>
          滾輪縮放：調整觀察距離
        </div>


      </div>
    </div>
  );
}