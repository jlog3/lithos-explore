import React, { useEffect, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Instances, Instance } from '@react-three/drei';

const MINERAL_COLORS = {
  'void': 'white',
  'quartz': 'gray',
  'feldspar': 'pink',
  'mica': 'black',
  'gold': 'yellow'
};

function Voxels({ chunk, size }) {
  if (!chunk || chunk.length === 0) return null;

  const minerals = useMemo(() => {
    const groups = {
      quartz: [],
      feldspar: [],
      mica: [],
      gold: []
    };

    chunk.forEach((plane, x) => {
      plane.forEach((row, y) => {
        row.forEach((mineral, z) => {
          if (mineral !== 'void') {
            groups[mineral].push([x - size / 2, y - size / 2, z - size / 2]);
          }
        });
      });
    });

    return groups;
  }, [chunk, size]);

  return (
    <group>
      {Object.entries(minerals).map(([type, positions]) => (
        positions.length > 0 && (
          <Instances key={type} limit={positions.length}>
            <boxGeometry args={[1.1, 1.1, 1.1]} />
            <meshStandardMaterial
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

function Explorer3D({ seed, xOffset, yOffset, zOffset, size }) {
  const [chunk, setChunk] = useState([]);

  useEffect(() => {
    const fetchChunk = async () => {
      const params = new URLSearchParams({
        seed,
        size,
        x_offset: xOffset,
        y_offset: yOffset,
        z_offset: zOffset
      });
      try {
        const response = await fetch(`/api/chunk3d?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setChunk(data);
          console.log('Fetched chunk:', data); // Log to confirm data in browser console
        } else {
          console.error('Error fetching chunk');
        }
      } catch (error) {
        console.error('Fetch error:', error);
      }
    };
    fetchChunk();
  }, [seed, xOffset, yOffset, zOffset, size]);

  return (
    <div className="explorer-3d">
      <Canvas style={{ background: 'white' }} camera={{ position: [0, 0, size * 2], fov: 50 }}>
        <ambientLight intensity={2.0} />
        <pointLight position={[0, 0, size * 2]} intensity={5.0} />
        <Voxels chunk={chunk} size={size} />
        <Box position={[0, 0, 0]} args={[2, 2, 2]}>
          <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.5} />
        </Box>
        <OrbitControls />
      </Canvas>
    </div>
  );
}

export default Explorer3D;
