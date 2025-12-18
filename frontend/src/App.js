import React, { useState, useEffect } from 'react';
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
  const [coverVariant, setCoverVariant] = useState(null);
  const [crustType, setCrustType] = useState('continental'); // Default to continental for initial covers
  const [chunkX, setChunkX] = useState(0);
  const [chunkY, setChunkY] = useState(0);
  const [chunkZ, setChunkZ] = useState(0);
  const [testMode, setTestMode] = useState(false);
  const [selectedMinerals, setSelectedMinerals] = useState([]);
  const [mineralColors, setMineralColors] = useState({});
  const [debugData, setDebugData] = useState(null);
  const [chunkDebugData, setChunkDebugData] = useState(null);
  useEffect(() => {
    const fetchMinerals = async () => {
      try {
        const response = await fetch('/minerals.json');
        if (response.ok) {
          const data = await response.json();
          const colors = {
            'void': [255, 255, 255],
            'cover': [165, 42, 42]
          };
          Object.entries(data.minerals).forEach(([name, minData]) => {
            colors[name] = minData.color;
          });
          data.coverVariants.forEach((variant) => {
            colors[`cover_${variant.id}`] = variant.color;
          });
          setMineralColors(colors);
        }
      } catch (error) {
        console.error('Error fetching minerals.json:', error);
      }
    };
    fetchMinerals();
  }, []);
  const downloadJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  // Pass to LocationInput and Explorer3D as zOffset = currentDepth
  return (
    <div className="app">
      <header>
        <h1>Lithos Explorer</h1>
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
        testMode={testMode} setTestMode={setTestMode}
        selectedMinerals={selectedMinerals} setSelectedMinerals={setSelectedMinerals}
        mineralColors={mineralColors}
        setDebugData={setDebugData}
        setCoverVariant={setCoverVariant}  // Added this
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
        testMode={testMode}
        selectedMinerals={selectedMinerals}
        mineralColors={mineralColors}
        crustType={crustType} // Added for location-based cover variants
        setChunkDebugData={setChunkDebugData}
        coverVariant={coverVariant}  // Added this
      />
      {debugData && (
        <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}>
          <h3>Debug Data</h3>
          <pre>{JSON.stringify(debugData, null, 2)}</pre>
          <button onClick={() => downloadJSON(debugData, 'debug_data.json')}>
            Download Debug JSON
          </button>
        </div>
      )}
      {chunkDebugData && (
        <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}>
          <h3>Chunk Debug Data</h3>
          <p>This section details the variables used in the model building process:</p>
          <ul>
            <li><strong>seed</strong>: The base seed string used for procedural generation, ensuring consistent results for the same inputs.</li>
            <li><strong>offsets</strong>: The x, y, z offsets derived from the location hash, positioning the chunk in the virtual world.</li>
            <li><strong>prob_offsets</strong>: Probability adjustments applied to minerals based on geological data, elevation, plate type, and deposits.</li>
            <li><strong>allowed_minerals</strong>: A list of restricted minerals (if in test mode), limiting generation to selected types.</li>
            <li><strong>use_vein_bias</strong>: A boolean indicating whether iterative vein biasing was applied to simulate mineral clustering.</li>
          </ul>
          <pre>{JSON.stringify(chunkDebugData, null, 2)}</pre>
          <button onClick={() => downloadJSON(chunkDebugData, 'chunk_debug_data.json')}>
            Download Chunk Debug JSON
          </button>
        </div>
      )}
      <EducationPanel />
    </div>
  );
}
export default App;
