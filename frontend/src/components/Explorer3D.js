import React, { useEffect, useState, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Box, Instances, Instance, Text } from '@react-three/drei'; // Removed axesHelper if not used
import { TrackballControls } from '@react-three/drei';
function Voxels({ chunk, size, mined, mineralColors, mineralData }) {
  if (!chunk || chunk.length === 0 || !mineralData) return null;
  const textures = useMemo(() => {
    if (!mineralData) return {};
    const loader = new THREE.TextureLoader();
    const loadTexture = (path, errorMsg) => {
      if (!path) return null;
      const tex = loader.load(path, undefined, undefined, () => console.error(errorMsg));
      tex.repeat.set(0.5, 0.5); // Full image over 2x2
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.magFilter = THREE.LinearFilter; // Smoother for partials
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };
    const result = {};
    Object.entries(mineralData.minerals).forEach(([name, data]) => {
      result[name] = loadTexture(data.texture, `${name} texture failed`);
    });
    mineralData.coverVariants.forEach((v) => {
      const key = `cover_${v.id}`;
      result[key] = loadTexture(v.texture, `${v.id} texture failed`);
    });
    return result;
  }, [mineralData]);
  const emissiveMaps = useMemo(() => {
    if (!mineralData) return {};
    const loader = new THREE.TextureLoader();
    const loadEmissive = (path, errorMsg) => {
      if (!path) return null;
      const tex = loader.load(path, undefined, undefined, () => console.error(errorMsg));
      tex.repeat.set(0.5, 0.5); // Changed: Span over 2x2
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.colorSpace = THREE.LinearSRGBColorSpace;
      return tex;
    };
    const result = {};
    Object.entries(mineralData.minerals).forEach(([name, data]) => {
      result[name] = loadEmissive(data.emissiveMap, `${name} emissive failed`);
    });
    mineralData.coverVariants.forEach((v) => {
      const key = `cover_${v.id}`;
      result[key] = loadEmissive(v.emissiveMap, `${v.id} emissive failed`);
    });
    return result;
  }, [mineralData]);
  const normalMaps = useMemo(() => {
    if (!mineralData) return {};
    const loader = new THREE.TextureLoader();
    const loadNormal = (path, errorMsg) => {
      if (!path) return null;
      const tex = loader.load(path, undefined, undefined, () => console.error(errorMsg));
      tex.repeat.set(0.5, 0.5); // Changed: Span over 2x2
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.colorSpace = THREE.LinearSRGBColorSpace;
      return tex;
    };
    const result = {};
    Object.entries(mineralData.minerals).forEach(([name, data]) => {
      result[name] = loadNormal(data.normalMap, `${name} normal failed`);
    });
    mineralData.coverVariants.forEach((v) => {
      const key = `cover_${v.id}`;
      result[key] = loadNormal(v.normalMap, `${v.id} normal failed`);
    });
    return result;
  }, [mineralData]);
  const roughnessMaps = useMemo(() => {
    if (!mineralData) return {};
    const loader = new THREE.TextureLoader();
    const loadRoughness = (path, errorMsg) => {
      if (!path) return null;
      const tex = loader.load(path, undefined, undefined, () => console.error(errorMsg));
      tex.repeat.set(0.5, 0.5); // Full image over 2x2
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.magFilter = THREE.LinearFilter; // Smoother for partials
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };
    const result = {};
    Object.entries(mineralData.minerals).forEach(([name, data]) => {
      result[name] = loadRoughness(data.roughnessMap, `${name} roughness failed`);
    });
    mineralData.coverVariants.forEach((v) => {
      const key = `cover_${v.id}`;
      result[key] = loadRoughness(v.roughnessMap, `${v.id} roughness failed`);
    });
    return result;
  }, [mineralData]);
  const minerals = useMemo(() => {
    const groups = {};
    Object.keys(mineralColors).forEach((type) => (groups[type] = []));
    chunk.forEach((plane, x) => {
      plane.forEach((row, y) => {
        row.forEach((mineral, z) => {
          const minedValue = mined[x][y][z];
          let displayType = null;
          if (minedValue && minedValue.startsWith('cover_')) {
            displayType = minedValue;
          } else {
            displayType = mineral === 'void' ? null : mineral;
          }
          if (displayType) {
            if (!groups[displayType]) groups[displayType] = [];
            groups[displayType].push([x - size / 2, y - size / 2, z - size / 2]);
          }
        });
      });
    });
    return groups;
  }, [chunk, size, mined, mineralColors]);
  return (
    <group>
      {Object.entries(minerals).map(([type, positions]) => (
        positions.length > 0 && (
          <Instances key={type} limit={positions.length}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              map={textures[type] || null}
              normalMap={normalMaps[type] || null}
              normalScale={new THREE.Vector2(1.0, 1.0)}
              emissiveMap={emissiveMaps[type] || null}
              roughnessMap={roughnessMaps[type] || null}
              color={textures[type] ? 'white' : (mineralColors[type] ? `rgb(${mineralColors[type].join(',')})` : 'white')}
              emissive={textures[type] ? 'white' : (mineralColors[type] ? `rgb(${mineralColors[type].join(',')})` : 'white')}
              emissiveIntensity={emissiveMaps[type] ? 1.0 : (textures[type] ? 0 : (type.startsWith('cover_') ? 0 : 0.5))}
              roughness={
                type.startsWith('cover_')
                  ? mineralData.coverVariants.find(v => v.id === type.slice(6))?.roughness ?? 0.8
                  : mineralData.minerals[type]?.roughness ?? 0.4
              }
              metalness={
                type.startsWith('cover_')
                  ? mineralData.coverVariants.find(v => v.id === type.slice(6))?.metalness ?? 0.0
                  : mineralData.minerals[type]?.metalness ?? 0.1
              }
            />
            {positions.map((pos, i) => (
              <Instance key={i} position={pos} />
            ))}
          </Instances>
        )
      ))}
    </group>
  );
}
function SetupRefs({ cameraRef, controlsRef }) {
  const { camera } = useThree();
  useEffect(() => {
    if (camera) {
      cameraRef.current = camera;
    }
  }, [camera, cameraRef]);
  return <TrackballControls ref={controlsRef} />;
  //return <OrbitControls ref={controlsRef} enableDamping={false} />;
  //return <OrbitControls ref={controlsRef} enableDamping={true} />;
  //return <OrbitControls ref={controlsRef} enableDamping={false} rotateSpeed={1} />; // Inverted horizontal rotation
  //return <OrbitControls ref={controlsRef} enableDamping={false} rotateSpeed={-1} />; // Inverted horizontal rotation
}
async function getMineralType(seed, x, y, z, probOffsets = {}, allowedMinerals = null, depthLayers) {
  const inputStr = `${seed}:${x}:${y}:${z}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(inputStr));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const hashInt = BigInt(`0x${hashHex.slice(-16)}`);
  const normalized = Number(hashInt) / (2 ** 64);
  let baseProbs = null;
  for (const layer of depthLayers) {
    if (layer.range[0] <= z && z < layer.range[1]) {
      baseProbs = { ...layer.probs };
      break;
    }
  }
  if (!baseProbs) return 'void';
  for (const [mineral, offset] of Object.entries(probOffsets)) {
    if (mineral in baseProbs) {
      baseProbs[mineral] += offset;
    }
  }
  if (allowedMinerals && allowedMinerals.length > 0) {
    baseProbs = Object.fromEntries(
      Object.entries(baseProbs).filter(([mineral]) => allowedMinerals.includes(mineral))
    );
  }
  const total = Object.values(baseProbs).reduce((a, b) => a + b, 0);
  if (total <= 0) return 'void';
  let cum = 0;
  const cumList = [];
  for (const mineral of Object.keys(baseProbs).sort()) {
    const p = baseProbs[mineral] / total;
    cum += p;
    cumList.push([cum, mineral]);
  }
  for (const [thresh, minType] of cumList) {
    if (normalized < thresh) {
      return minType;
    }
  }
  return cumList[cumList.length - 1][1];
}
function Explorer3D({ seed, xOffset, yOffset, zOffset, size, probOffsets, chunkX = 0, chunkY = 0, chunkZ = 0, testMode, selectedMinerals, mineralColors, crustType, setChunkDebugData, coverVariant }) {
  const [mineralData, setMineralData] = useState(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/minerals.json');
        if (response.ok) {
          setMineralData(await response.json());
        }
      } catch (error) {
        console.error('Error fetching minerals.json:', error);
      }
    };
    fetchData();
  }, []);
  const coverVariants = useMemo(() => mineralData?.coverVariants?.map(v => v.id) ?? [], [mineralData]);
  const depthLayers = useMemo(() => {
    if (!mineralData) return [];
    const layersMap = {
      "0-10": [0, 10],
      "11-35": [11, 35],
      "36-inf": [36, Infinity]
    };
    return Object.entries(layersMap).map(([key, range]) => {
      const probs = {};
      Object.entries(mineralData.minerals).forEach(([name, data]) => {
        const prob = data.prob_layers?.[key] ?? 0.0;
        if (prob > 0) probs[name] = prob;
      });
      probs['void'] = (range[0] === 0 || range[0] === 11) ? 0.1 : 0.05;
      return { range, probs };
    });
  }, [mineralData]);
  const [chunk, setChunk] = useState([]);
  const [mined, setMined] = useState(() => {
    const stored = localStorage.getItem('mined');
    if (stored) return JSON.parse(stored);
    return Array.from({ length: size }, () => Array.from({ length: size }, () => Array(size).fill(null)));
  });
  const [maxMinedDepth, setMaxMinedDepth] = useState(0);
  const [usedMinerals, setUsedMinerals] = useState([]);
  const groupRef = useRef();
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  useEffect(() => {
    localStorage.removeItem('mined');
  }, [seed, xOffset, yOffset, zOffset, size, probOffsets, chunkX, chunkY, chunkZ, testMode, selectedMinerals]);
  useEffect(() => {
    if (!mineralData) return;  // Added: Guard against race condition
    const fetchChunk = async () => {
      const params = new URLSearchParams({
        seed,
        size,
        x_offset: xOffset,
        y_offset: yOffset,
        z_offset: zOffset,
        prob_offsets: JSON.stringify(probOffsets),
        chunk_x: chunkX,
        chunk_y: chunkY,
        chunk_z: chunkZ,
        debug: 'true' // Added to request debug info
      });
      if (testMode && selectedMinerals.length > 0) {
        params.append('allowed_minerals', JSON.stringify(selectedMinerals));
      }
      try {
        const response = await fetch(`/api/chunk3d?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          const chunkData = data.chunk || data; // Handle chunk properly
          setChunk(chunkData);
          setChunkDebugData(data.debug_info || null); // Set debug data
          console.log("Model generated successfully. Chunk data:", data);
          const stored = localStorage.getItem('mined');
          if (stored) {
            setMined(JSON.parse(stored));
          } else {
            const newMined = await initializeMined(chunkData, size, seed, xOffset, yOffset, zOffset, probOffsets, crustType, testMode ? selectedMinerals : null, depthLayers);
            setMined(newMined);
            localStorage.setItem('mined', JSON.stringify(newMined));
          }
          // Initial unique minerals from chunk (moved to separate useEffect for full scan)
        } else {
          console.error('Error fetching chunk');
        }
      } catch (error) {
        console.error('Fetch error:', error);
      }
    };
    fetchChunk();
  }, [seed, xOffset, yOffset, zOffset, size, probOffsets, chunkX, chunkY, chunkZ, testMode, selectedMinerals, depthLayers, crustType, mineralData, setChunkDebugData]);
  // New useEffect for computing usedMinerals including covers from mined
  useEffect(() => {
    if (chunk.length > 0 && mined.length > 0) {
      const allUnique = new Set();
      chunk.forEach((plane, x) => {
        plane.forEach((row, y) => {
          row.forEach((mineral, z) => {
            if (mineral !== 'void') allUnique.add(mineral);
            const minedVal = mined[x][y][z];
            if (minedVal && minedVal.startsWith('cover_')) allUnique.add(minedVal);
          });
        });
      });
      setUsedMinerals(Array.from(allUnique).sort());
    }
  }, [chunk, mined]);
  const initializeMined = async (chunk, size, seed, xOffset, yOffset, zOffset, probOffsets, crustType, allowedMinerals, depthLayers) => {
    const newMined = Array.from({ length: size }, () => Array.from({ length: size }, () => Array(size).fill(null)));
    let coverId;
    if (coverVariant) {
      coverId = coverVariant;
    } else {
      if (!mineralData || !mineralData.coverVariants) {  // Added: Extra safeguard (though race fix should prevent)
        console.error('mineralData not ready for covers; using default');
        coverId = 'clayey_mudflat';  // Fallback to your default from minerals.json
      } else {
        const variants = mineralData.coverVariants.map(v => v.id);
        const randomIndex = Math.floor(Math.random() * variants.length);
        coverId = variants[randomIndex];
      }
    }
    for (let lx = 0; lx < size; lx++) {
      for (let ly = 0; ly < size; ly++) {
        newMined[lx][ly][0] = `cover_${coverId}`;
      }
    }
    return newMined;
  };
  useEffect(() => {
    let newMax = 0;
    while (true) {
      const layerFullyMined = !mined.some(plane => plane.some(row => row[newMax] && row[newMax].startsWith('cover_')));
      if (!layerFullyMined) break;
      newMax++;
      if (newMax >= size) break;
    }
    setMaxMinedDepth(newMax);
  }, [mined, size]);
  useEffect(() => {
    const handleClick = (event) => {
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      const raycaster = new THREE.Raycaster();
      const camera = cameraRef.current;
      if (!camera) return;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(groupRef.current?.children || [], true);
      if (intersects.length) {
        const { point } = intersects[0];
        const x = Math.floor(point.x + size / 2);
        const y = Math.floor(point.y + size / 2);
        const z = Math.floor(point.z + size / 2);
        if (z < size && x >= 0 && x < size && y >= 0 && y < size && z >= 0 && z <= maxMinedDepth) {
          if (mined[x][y][z] && mined[x][y][z].startsWith('cover_')) {
            const newMined = mined.map(plane => plane.map(row => row.slice()));
            newMined[x][y][z] = chunk[x][y][z];
            setMined(newMined);
            localStorage.setItem('mined', JSON.stringify(newMined));
            alert(`Mined ${chunk[x][y][z]}: Example info (e.g., SiO2 for quartz).`);
          }
        }
      }
    };
    window.addEventListener('pointerdown', handleClick);
    return () => window.removeEventListener('pointerdown', handleClick);
  }, [chunk, mined, size, maxMinedDepth]);
  const snapToAxis = (axis, positive) => {
    const dist = size * 1.5;
    let pos = [0, 0, 0];
    if (axis === 'x') pos[0] = positive ? dist : -dist;
    if (axis === 'y') pos[1] = positive ? dist : -dist;
    if (axis === 'z') pos[2] = positive ? dist : -dist;
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(...pos);
      cameraRef.current.lookAt(0, 0, 0);
      controlsRef.current.update();
    }
  };
  if (!mineralData) return <div>Loading mineral data...</div>;
  return (
    <div className="explorer-3d" style={{ position: 'relative' }}>
      <Canvas
        style={{ background: 'white' }}
        camera={{ position: [0, 0, size * 2], fov: 50 }}
        gl={{
          antialias: true,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <ambientLight intensity={2.0} />
        <pointLight position={[0, 0, size * 2]} intensity={5.0} />
        <group ref={groupRef}>
          <Voxels chunk={chunk} size={size} mined={mined} mineralColors={mineralColors} mineralData={mineralData} />
        </group>
        <Box position={[0, 0, 0]} args={[2, 2, 2]}>
          <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.5} />
        </Box>
        <Text position={[size / 2 + 1, 0, 0]} color="red" fontSize={1}>X</Text>
        <Text position={[0, size / 2 + 1, 0]} color="green" fontSize={1}>Y</Text>
        <Text position={[0, 0, size / 2 + 1]} color="blue" fontSize={1}>Z (Depth)</Text>
        <Text position={[0, 0, -size / 2]} color="black" fontSize={1}>Surface (Z=0)</Text>
        <SetupRefs cameraRef={cameraRef} controlsRef={controlsRef} />
      </Canvas>
      <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(255,255,255,0.8)', padding: 10, borderRadius: 5 }}>
        <h4>Mineral Key</h4>
        {usedMinerals.map(mineral => {
          const isCover = mineral.startsWith('cover_');
          const texturePath = isCover
            ? mineralData.coverVariants.find(v => v.id === mineral.slice(6))?.texture
            : mineralData.minerals[mineral]?.texture;
          return (
            <div key={mineral} style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
              {texturePath ? (
                <img src={texturePath} alt={mineral} style={{ width: 20, height: 20, marginRight: 10, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 20, height: 20, background: `rgb(${mineralColors[mineral]?.join(',') || '0,0,0'})`, marginRight: 10 }} />
              )}
              {mineral.charAt(0).toUpperCase() + mineral.slice(1)}
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.8)', padding: 10, borderRadius: 5 }}>
        <h4>Orientation Gizmo</h4>
        <div>
          <button onClick={() => snapToAxis('x', true)}>+X</button>
          <button onClick={() => snapToAxis('x', false)}>-X</button>
        </div>
        <div>
          <button onClick={() => snapToAxis('y', true)}>+Y</button>
          <button onClick={() => snapToAxis('y', false)}>-Y</button>
        </div>
        <div>
          <button onClick={() => snapToAxis('z', true)}>+Z</button>
          <button onClick={() => snapToAxis('z', false)}>-Z</button>
        </div>
      </div>
    </div>
  );
}
export default Explorer3D;
