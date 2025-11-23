import React, { useEffect, useState, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Instances, Instance, Text, axesHelper } from '@react-three/drei';
const MINERAL_COLORS = {
  'void': 'white',
  'quartz': 'gray',
  'feldspar': 'pink',
  'mica': 'black',
  'gold': 'yellow',
  'basalt': 'darkgray',
  'granite': 'lightgray',
  'copper': 'orange',
  'iron': 'silver',
  'diamond': 'lightblue',
  'emerald': 'green',
  // Add more as per backend
  'cover': 'brown' // For mining cover
};
function Voxels({ chunk, size, mined }) {
  if (!chunk || chunk.length === 0) return null;
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    loader.load('/rock_texture.png', undefined, undefined, () => console.error('Texture load failed; falling back to color'));
    return loader;  // Map will be null if fails
  }, []);
  const minerals = useMemo(() => {
    const groups = {};
    Object.keys(MINERAL_COLORS).forEach(type => groups[type] = []);
    chunk.forEach((plane, x) => {
      plane.forEach((row, y) => {
        row.forEach((mineral, z) => {
          const displayType = mined[x][y][z] === 'cover' ? 'cover' : (mineral === 'void' ? null : mineral);
          if (displayType) {
            groups[displayType].push([x - size / 2, y - size / 2, z - size / 2]);
          }
        });
      });
    });
    return groups;
  }, [chunk, size, mined]);
  return (
    <group>
      {Object.entries(minerals).map(([type, positions]) => (
        positions.length > 0 && (
          <Instances key={type} limit={positions.length}>
            <boxGeometry args={[1.1, 1.1, 1.1]} />
            <meshStandardMaterial
              map={texture}
              color={MINERAL_COLORS[type]}
              emissive={MINERAL_COLORS[type]}
              emissiveIntensity={0.5}
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
function Explorer3D({ seed, xOffset, yOffset, zOffset, size, probOffsets, chunkX = 0, chunkY = 0, chunkZ = 0 }) { // Add chunk props
  const [chunk, setChunk] = useState([]);
  const [mined, setMined] = useState(() => {
    const stored = localStorage.getItem('mined');
    return stored ? JSON.parse(stored) : Array(size).fill().map(() => Array(size).fill().map(() => Array(size).fill('cover')));
  });
  const [maxMinedDepth, setMaxMinedDepth] = useState(0);
  const groupRef = useRef();
  useEffect(() => {
    const fetchChunk = async () => {
      const params = new URLSearchParams({
        seed,
        size,
        x_offset: xOffset,
        y_offset: yOffset,
        z_offset: zOffset,
        prob_offsets: JSON.stringify(probOffsets),
        chunk_x: chunkX, // For chunked
        chunk_y: chunkY,
        chunk_z: chunkZ
      });
      try {
        const response = await fetch(`/api/chunk3d?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setChunk(data);
          console.log('Fetched chunk:', data);
        } else {
          console.error('Error fetching chunk');
        }
      } catch (error) {
        console.error('Fetch error:', error);
      }
    };
    fetchChunk();
  }, [seed, xOffset, yOffset, zOffset, size, probOffsets, chunkX, chunkY, chunkZ]);
  useEffect(() => {
    let newMax = maxMinedDepth;
    for (let d = 0; d <= maxMinedDepth; d++) {
      const layerFullyMined = !mined.some(plane => plane.some(row => row[d] === 'cover'));
      if (layerFullyMined) {
        newMax = Math.max(newMax, d + 1);
      }
    }
    setMaxMinedDepth(newMax);
  }, [mined, size]);
  useEffect(() => {
    const handleClick = (event) => {
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      const raycaster = new THREE.Raycaster();
      const camera = groupRef.current?.parent?.camera; // Get camera from scene
      if (!camera) return;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(groupRef.current.children, true);
      if (intersects.length) {
        const { point } = intersects[0];
        const x = Math.floor(point.x + size / 2);
        const y = Math.floor(point.y + size / 2);
        const z = Math.floor(point.z + size / 2);
        if (z <= maxMinedDepth && x >= 0 && x < size && y >= 0 && y < size && z >= 0 && z < size) {
          const newMined = mined.map(plane => plane.map(row => row.slice())); // Deep copy
          newMined[x][y][z] = chunk[x][y][z]; // Reveal real
          setMined(newMined);
          localStorage.setItem('mined', JSON.stringify(newMined));
          alert(`Mined ${chunk[x][y][z]}: Example info (e.g., SiO2 for quartz).`); // Educational pop-up
        }
      }
    };
    window.addEventListener('pointerdown', handleClick);
    return () => window.removeEventListener('pointerdown', handleClick);
  }, [chunk, mined, size, maxMinedDepth]);
  return (
    <div className="explorer-3d">
      <Canvas style={{ background: 'white' }} camera={{ position: [0, 0, size * 2], fov: 50 }}>
        <ambientLight intensity={2.0} />
        <pointLight position={[0, 0, size * 2]} intensity={5.0} />
        <group ref={groupRef}>
          <Voxels chunk={chunk} size={size} mined={mined} />
        </group>
        <Box position={[0, 0, 0]} args={[2, 2, 2]}>
          <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.5} />
        </Box>
        <axesHelper args={[size / 2]} />
        <Text position={[size / 2 + 1, 0, 0]} color="red" fontSize={1}>X</Text>
        <Text position={[0, size / 2 + 1, 0]} color="green" fontSize={1}>Y</Text>
        <Text position={[0, 0, size / 2 + 1]} color="blue" fontSize={1}>Z (Depth)</Text>
        <Text position={[0, 0, -size / 2]} color="black" fontSize={1}>Surface (Z=0)</Text>
        <OrbitControls />
      </Canvas>
    </div>
  );
}
export default Explorer3D;
