import React, { useState } from 'react';
function LocationInput({ seed, setSeed, xOffset, setXOffset, yOffset, setYOffset, zOffset, setZOffset, size, setSize, probOffsets, setProbOffsets, crustType, setCrustType, chunkX, setChunkX, chunkY, setChunkY, chunkZ, setChunkZ }) {
  const [location, setLocation] = useState('');
  const handleLocationSubmit = async (e) => {
    e.preventDefault();
    if (!location) return;
    try {
      const response = await fetch(`/api/offsets?location=${encodeURIComponent(location)}`);
      if (response.ok) {
        const data = await response.json();
        setXOffset(data.x_offset);
        setYOffset(data.y_offset);
        setZOffset(data.z_offset);
        // New
        setCrustType(data.crust_type);
        setProbOffsets(data.prob_offsets);
      } else {
        console.error('Error fetching offsets');
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };
  return (
    <div className="location-input">
      <form onSubmit={handleLocationSubmit}>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter location (e.g., Paris)"
        />
        <button type="submit">Go to Location</button>
        <button onClick={() => setZOffset(Math.max(0, zOffset - 10))}>Ascend (-10)</button>
        <button onClick={() => setZOffset(zOffset + 10)}>Dig Deeper (+10)</button>
        {/* For chunked expansion */}
        <button onClick={() => setChunkX(chunkX + 1)}>Expand X (+)</button>
        <button onClick={() => setChunkX(chunkX - 1)}>Expand X (-)</button>
        <button onClick={() => setChunkY(chunkY + 1)}>Expand Y (+)</button>
        <button onClick={() => setChunkY(chunkY - 1)}>Expand Y (-)</button>
        <button onClick={() => setChunkZ(chunkZ + 1)}>Expand Z (+)</button>
        <button onClick={() => setChunkZ(chunkZ - 1)}>Expand Z (-)</button>
      </form>
      <div>
        <label>Seed:</label>
        <input type="text" value={seed} onChange={(e) => setSeed(e.target.value)} />
      </div>
      <div>
        <label>X Offset:</label>
        <input type="number" value={xOffset} onChange={(e) => setXOffset(parseInt(e.target.value) || 0)} />
      </div>
      <div>
        <label>Y Offset:</label>
        <input type="number" value={yOffset} onChange={(e) => setYOffset(parseInt(e.target.value) || 0)} />
      </div>
      <div>
        <label>Z Offset:</label>
        <input type="number" value={zOffset} onChange={(e) => setZOffset(parseInt(e.target.value) || 0)} />
      </div>
      <div>
        <label>Size:</label>
        <input type="number" value={size} onChange={(e) => setSize(Math.min(Math.max(parseInt(e.target.value) || 32, 1), 128))} min="1" max="128" />
      </div>
      <p>Crust Type: {crustType}</p>
    </div>
  );
}
export default LocationInput;
