import React from 'react';
function EducationPanel() {
  return (
    <div className="education-panel">
      <h2>About LithosCipher</h2>
      <p>This app uses cryptographic hashing to generate procedural rock formations.</p>
      <p>Each point in 3D space is determined by hashing the seed and coordinates, normalized to select a mineral based on probabilities.</p>
      <p>Minerals and Probabilities:</p>
      <p>Probabilities are approximate and vary by depth and location for geologic realism. Common minerals are more likely, rares in veins/clusters.</p>
      <p>Location inputs are hashed to generate unique offsets for region-specific exploration, simulating geographic variety.</p>
      <p>Depth Layers:</p>
      <ul>
        <li>0-10 units (Surface): Sedimentary - High void/quartz. Expect soil-like porosity.</li>
        <li>11-35 units (Crust): Veins - Feldspar, mica, occasional gold/copper.</li>
        <li>36+ units (Deep): Rares - Basalt, iron, diamonds in clusters.</li>
      </ul>
    </div>
  );
}
export default EducationPanel;
