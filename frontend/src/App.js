import React, { useState } from 'react';
import Explorer3D from './components/Explorer3D';
import LocationInput from './components/LocationInput';
import EducationPanel from './components/EducationPanel';
import './styles.css';

function App() {
  const [seed, setSeed] = useState('default_seed');
  const [xOffset, setXOffset] = useState(0);
  const [yOffset, setYOffset] = useState(0);
  const [zOffset, setZOffset] = useState(0);
  const [size, setSize] = useState(32);
  const [currentDepth, setCurrentDepth] = useState(0);
  const [probOffsets, setProbOffsets] = useState({});
  const [crustType, setCrustType] = useState('');
  const [chunkX, setChunkX] = useState(0);
  const [chunkY, setChunkY] = useState(0);
  const [chunkZ, setChunkZ] = useState(0);
  // Pass to LocationInput and Explorer3D as zOffset = currentDepth
  return (
    <div className="app">
      <header>
        <h1>LithosCipher Explorer</h1>
      </header>
      <LocationInput
        seed={seed} setSeed={setSeed}
        xOffset={xOffset} setXOffset={setXOffset}
        yOffset={yOffset} setYOffset={setYOffset}
        zOffset={currentDepth} setZOffset={setCurrentDepth}
        size={size} setSize={setSize}
        probOffsets={probOffsets} setProbOffsets={setProbOffsets}
        crustType={crustType} setCrustType={setCrustType}
        chunkX={chunkX} setChunkX={setChunkX}
        chunkY={chunkY} setChunkY={setChunkY}
        chunkZ={chunkZ} setChunkZ={setChunkZ}
      />
      <Explorer3D
        seed={seed}
        xOffset={xOffset}
        yOffset={yOffset}
        zOffset={currentDepth}
        size={size}
        probOffsets={probOffsets}
        chunkX={chunkX}
        chunkY={chunkY}
        chunkZ={chunkZ}
      />
      <EducationPanel />
    </div>
  );
}

export default App;
