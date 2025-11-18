from flask import Flask, jsonify, request
import hashlib
import numpy as np
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
# Mineral to color mapping (RGB) for visualizations
MINERAL_COLORS = {
    'void': (255, 255, 255),  # White
    'quartz': (128, 128, 128),  # Gray
    'feldspar': (255, 192, 203),  # Pink
    'mica': (0, 0, 0),  # Black
    'gold': (255, 215, 0)  # Yellow
}

def get_mineral_type(seed, x, y, z):
    """
    Determine the mineral type at a point (x, y, z) using a cryptographic hash.

    Hashes the seed + coordinates, normalizes to [0,1), and assigns mineral types
    based on cumulative probability thresholds for heterogeneity.

    Thresholds (cumulative):
    - 0.0-0.4: void (empty space, for porosity)
    - 0.4-0.7: quartz (common)
    - 0.7-0.85: feldspar
    - 0.85-0.95: mica
    - 0.95-1.0: gold (rare veins)

    Args:
        seed (str): The seed for consistency.
        x, y, z (int): Coordinates to check.

    Returns:
        str: Mineral type.
    """
    input_str = f"{seed}:{x}:{y}:{z}"
    hash_obj = hashlib.sha256(input_str.encode())
    hash_int = int.from_bytes(hash_obj.digest()[-8:], 'big')
    normalized = hash_int / (2**64)

    if normalized < 0.4:
        return 'void'
    elif normalized < 0.7:
        return 'quartz'
    elif normalized < 0.85:
        return 'feldspar'
    elif normalized < 0.95:
        return 'mica'
    else:
        return 'gold'

def generate_slice(seed, size, z_offset=0, x_offset=0, y_offset=0, zoom=1):
    """
    Generate a 2D numpy array of colors for the slice at z.
    """
    effective_size = size // zoom
    if effective_size <= 0:
        return np.zeros((size, size, 3), dtype=np.uint8)  # Fallback to black
    small_grid = np.zeros((effective_size, effective_size, 3), dtype=np.uint8)
    for x in range(effective_size):
        for y in range(effective_size):
            mineral = get_mineral_type(seed, x_offset + x, y_offset + y, z_offset)
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
def generate_2d_slice(seed, size, z, x_offset=0, y_offset=0):
    slice_data = [[get_mineral_type(seed, x + x_offset, y + y_offset, z) for y in range(size)] for x in range(size)]
    return slice_data

# For 3D API, returns list of lists of lists of mineral strings
def generate_3d_chunk(seed, size, x_offset=0, y_offset=0, z_offset=0):
    chunk = [[[get_mineral_type(seed, x + x_offset, y + y_offset, z + z_offset) for z in range(size)] for y in range(size)] for x in range(size)]
    return chunk

# Map a location string to offsets for region-specific exploration
def get_offsets_from_location(location):
    hash_obj = hashlib.sha256(location.encode())
    hash_bytes = hash_obj.digest()
    x_offset = int.from_bytes(hash_bytes[0:4], 'big') % (1 << 30)
    y_offset = int.from_bytes(hash_bytes[4:8], 'big') % (1 << 30)
    z_offset = int.from_bytes(hash_bytes[8:12], 'big') % (1 << 30)
    return x_offset, y_offset, z_offset

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
        x_offset = int(request.args.get('x_offset', 0))
        y_offset = int(request.args.get('y_offset', 0))
        z_offset = int(request.args.get('z_offset', 0))
        chunk = generate_3d_chunk(seed, size, x_offset, y_offset, z_offset)
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
        slice_data = generate_2d_slice(seed, size, z, x_offset, y_offset)
        return jsonify(slice_data)
    except ValueError:
        return jsonify({'error': 'Invalid integer parameter'}), 400

@app.route('/api/offsets', methods=['GET'])
def api_get_offsets():
    location = request.args.get('location')
    if not location:
        return jsonify({'error': 'Missing location'}), 400
    try:
        x_offset, y_offset, z_offset = get_offsets_from_location(location)
        return jsonify({'x_offset': x_offset, 'y_offset': y_offset, 'z_offset': z_offset})
    except ValueError:
        return jsonify({'error': 'Invalid parameter'}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
