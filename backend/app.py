from flask import Flask, jsonify, request
import hashlib
import numpy as np
from flask_cors import CORS
import json
app = Flask(__name__)
CORS(app)
import requests  # New import

# Expanded minerals (add more as needed; colors for visualization)
MINERAL_COLORS = {
    'void': (255, 255, 255),  # White (porosity)
    'quartz': (128, 128, 128),  # Gray (sedimentary)
    'feldspar': (255, 192, 203),  # Pink (crustal)
    'mica': (0, 0, 0),  # Black (metamorphic)
    'gold': (255, 215, 0),  # Yellow (veins)
    'basalt': (50, 50, 50),  # Dark gray (volcanic)
    'granite': (200, 200, 200),  # Light gray (igneous)
    'copper': (184, 115, 51),  # Copper color
    'iron': (100, 100, 100),  # Metallic gray
    'diamond': (173, 216, 230),  # Light blue (rare)
    'emerald': (0, 255, 0),  # Green (gems)
    # Add more: silver, coal, limestone, etc.
}

# Define base depth layers with non-cumulative probabilities (dict of mineral: prob)
DEPTH_LAYERS = {
    (0, 10): {'void': 0.5, 'quartz': 0.3, 'feldspar': 0.1, 'mica': 0.05, 'gold': 0.05},  # Surface: porous/sedimentary
    (11, 35): {'void': 0.2, 'feldspar': 0.4, 'mica': 0.2, 'granite': 0.1, 'copper': 0.05, 'gold': 0.05},  # Crust: veins
    (36, float('inf')): {'void': 0.1, 'basalt': 0.3, 'iron': 0.3, 'diamond': 0.15, 'emerald': 0.1, 'gold': 0.05},  # Deep: rares
}

def get_mineral_type(seed, x, y, z, prob_offsets=None):
    input_str = f"{seed}:{x}:{y}:{z}"
    hash_obj = hashlib.sha256(input_str.encode())
    hash_int = int.from_bytes(hash_obj.digest()[-8:], 'big')
    normalized = hash_int / (2**64)
    
    # Find layer for depth z
    for depth_range, base_probs_dict in DEPTH_LAYERS.items():
        if depth_range[0] <= z < depth_range[1]:
            probs = base_probs_dict.copy()
            # Apply location offsets
            if prob_offsets:
                for mineral, offset in prob_offsets.items():
                    if mineral in probs:
                        probs[mineral] += offset
            total = sum(probs.values())
            if total <= 0:
                return 'void'  # Fallback if invalid
            # Normalize and build cumulative (sorted keys for consistency)
            cum = 0
            cum_list = []
            for mineral in sorted(probs.keys()):
                p = probs[mineral] / total
                cum += p
                cum_list.append((cum, mineral))
            # Select based on hash
            for thresh, min_type in cum_list:
                if normalized < thresh:
                    return min_type
            return cum_list[-1][1]  # Fallback
    return 'void'  # Default

def generate_slice(seed, size, z_offset=0, x_offset=0, y_offset=0, zoom=1, prob_offsets=None):
    """
    Generate a 2D numpy array of colors for the slice at z.
    """
    effective_size = size // zoom
    if effective_size <= 0:
        return np.zeros((size, size, 3), dtype=np.uint8)  # Fallback to black
    small_grid = np.zeros((effective_size, effective_size, 3), dtype=np.uint8)
    for x in range(effective_size):
        for y in range(effective_size):
            mineral = get_mineral_type(seed, x_offset + x, y_offset + y, z_offset, prob_offsets)
            small_grid[y, x] = MINERAL_COLORS[mineral]  # Note: For pygame or similar
    grid = np.repeat(small_grid, zoom, axis=0)
    grid = np.repeat(grid, zoom, axis=1)
    # If not exact size, pad with black
    if grid.shape[0] < size:
        padded = np.zeros((size, size, 3), dtype=np.uint8)
        padded[:grid.shape[0], :grid.shape[1]] = grid
        grid = padded
    return grid

# For API, returns list of lists of mineral strings (JSON-friendly)
def generate_2d_slice(seed, size, z, x_offset=0, y_offset=0, prob_offsets=None):
    slice_data = [[get_mineral_type(seed, x + x_offset, y + y_offset, z, prob_offsets) for y in range(size)] for x in range(size)]
    return slice_data

# Update generate_3d_chunk to pass z
def generate_3d_chunk(seed, size, x_offset=0, y_offset=0, z_offset=0, prob_offsets=None):
    chunk = [[[get_mineral_type(seed, x + x_offset, y + y_offset, z + z_offset, prob_offsets) for z in range(size)] for y in range(size)] for x in range(size)]
    return chunk

# Map a location string to offsets for region-specific exploration
def get_offsets_from_location(location):
    # Existing hash for offsets
    hash_obj = hashlib.sha256(location.encode())
    hash_bytes = hash_obj.digest()
    x_offset = int.from_bytes(hash_bytes[0:4], 'big') % (1 << 30)
    y_offset = int.from_bytes(hash_bytes[4:8], 'big') % (1 << 30)
    z_offset = int.from_bytes(hash_bytes[8:12], 'big') % (1 << 30)
    
    crust_type = 'continental'  # Default
    prob_offsets = {}  # e.g., {'gold': 0.1, 'basalt': 0.15}
    
    try:
        # Geocode to lat/long (Nominatim)
        geo_url = f"https://nominatim.openstreetmap.org/search?q={location}&format=json"
        geo_resp = requests.get(geo_url, headers={'User-Agent': 'LithosExplorer/1.0'})
        if geo_resp.ok:
            geo_data = geo_resp.json()
            if geo_data:
                lat = float(geo_data[0]['lat'])
                lon = float(geo_data[0]['lon'])
                
                # Query USGS MRDS (bbox ±0.5 deg for local)
                min_lat, max_lat = lat - 0.5, lat + 0.5
                min_lon, max_lon = lon - 0.5, lon + 0.5
                mrds_url = f"https://mrdata.usgs.gov/mrds/search-bbox.php?min_lat={min_lat}&max_lat={max_lat}&min_lon={min_lon}&max_lon={max_lon}&format=json"
                mrds_resp = requests.get(mrds_url)
                if mrds_resp.ok:
                    mrds_data = mrds_resp.json()
                    if 'features' in mrds_data:  # Assuming GeoJSON-like
                        minerals = []
                        for feat in mrds_data['features']:
                            if 'commodity' in feat['properties']:
                                comm_str = feat['properties']['commodity'].lower()
                                minerals.extend([m.strip() for m in comm_str.split(',') if m.strip()])
                        from collections import Counter
                        common = Counter(minerals).most_common(5)  # Top 5
                        # Map to our minerals and boost probs
                        total_minerals = len(minerals)
                        for min_name, count in common:
                            if total_minerals > 0:
                                boost = 0.1 * (count / total_minerals)
                            else:
                                boost = 0.05  # Default if no minerals
                            if 'gold' in min_name:
                                prob_offsets['gold'] = boost
                            elif 'copper' in min_name:
                                prob_offsets['copper'] = boost
                            # Add mappings for others (e.g., 'basalt', 'iron')
                        # Infer crust_type from common minerals
                        if any('basalt' in m or 'volcanic' in m for m in minerals):
                            crust_type = 'volcanic'
    except Exception as e:
        print(f"API error: {e}")
        # Fallback hash for crust_type
        crust_hash = int.from_bytes(hash_bytes[12:16], 'big') % 5
        crust_types = ['sedimentary', 'igneous', 'volcanic', 'metamorphic', 'continental']
        crust_type = crust_types[crust_hash]
        # Simple offsets based on type
        if crust_type == 'volcanic':
            prob_offsets = {'basalt': 0.1, 'mica': 0.05}
        # Add for others
    
    return x_offset, y_offset, z_offset, crust_type, prob_offsets

@app.route('/api/offsets', methods=['GET'])
def api_get_offsets():
    location = request.args.get('location')
    if not location:
        return jsonify({'error': 'Missing location'}), 400
    x_offset, y_offset, z_offset, crust_type, prob_offsets = get_offsets_from_location(location)
    return jsonify({'x_offset': x_offset, 'y_offset': y_offset, 'z_offset': z_offset, 'crust_type': crust_type, 'prob_offsets': prob_offsets})

@app.route('/api/mineral', methods=['GET'])
def api_get_mineral():
    try:
        seed = request.args.get('seed', 'default_seed')
        x = int(request.args.get('x', 0))
        y = int(request.args.get('y', 0))
        z = int(request.args.get('z', 0))
        mineral = get_mineral_type(seed, x, y, z)
        return jsonify({'mineral': mineral})
    except ValueError:
        return jsonify({'error': 'Invalid integer parameter'}), 400

@app.route('/api/chunk3d', methods=['GET'])
def api_generate_3d_chunk():
    try:
        seed = request.args.get('seed', 'default_seed')
        size = min(int(request.args.get('size', 32)), 128)
        chunk_x = int(request.args.get('chunk_x', 0))
        chunk_y = int(request.args.get('chunk_y', 0))
        chunk_z = int(request.args.get('chunk_z', 0))
        x_offset = int(request.args.get('x_offset', 0))
        y_offset = int(request.args.get('y_offset', 0))
        z_offset = int(request.args.get('z_offset', 0))
        x_offset += size * chunk_x
        y_offset += size * chunk_y
        z_offset += size * chunk_z
        prob_offsets = json.loads(request.args.get('prob_offsets', '{}'))
        chunk = generate_3d_chunk(seed, size, x_offset, y_offset, z_offset, prob_offsets)
        return jsonify(chunk)
    
    except ValueError:
        return jsonify({'error': 'Invalid integer parameter'}), 400

@app.route('/api/slice2d', methods=['GET'])
def api_generate_2d_slice():
    try:
        seed = request.args.get('seed', 'default_seed')
        size = int(request.args.get('size', 100))
        z = int(request.args.get('z', 0))
        x_offset = int(request.args.get('x_offset', 0))
        y_offset = int(request.args.get('y_offset', 0))
        prob_offsets = json.loads(request.args.get('prob_offsets', '{}'))
        slice_data = generate_2d_slice(seed, size, z, x_offset, y_offset, prob_offsets)
        return jsonify(slice_data)
    except ValueError:
        return jsonify({'error': 'Invalid integer parameter'}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
