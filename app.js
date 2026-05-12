function haversineMeters([lon1, lat1], [lon2, lat2]) {
  const R = 6371000; // Earth radius in meters
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getElevForIndex(coord, idx, props) {
  if (Array.isArray(coord) && coord.length > 2 && typeof coord[2] === 'number') {
    return coord[2];
  }
  if (props && Array.isArray(props.elevations) && typeof props.elevations[idx] === 'number') {
    return props.elevations[idx];
  }
  if (props && typeof props.elevation === 'number') {
    return props.elevation;
  }
  return null;
}

function processFeature(feature) {
  if (!feature || !feature.geometry || feature.geometry.type !== 'LineString') {
    return null;
  }

  const coords = feature.geometry.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) {
    return null;
  }

  const props = feature.properties || {};
  const segments = [];
  let totalDist = 0;
  let totalGain = 0;
  let totalLoss = 0;

  for (let i = 0; i < coords.length - 1; i++) {
    const a = coords[i];
    const b = coords[i + 1];
    const z1 = getElevForIndex(a, i, props);
    const z2 = getElevForIndex(b, i + 1, props);
    const dist = haversineMeters([a[0], a[1]], [b[0], b[1]]);
    const dh = z1 === null || z2 === null ? null : z2 - z1;
    const slope = dh === null || dist === 0 ? null : (dh / dist) * 100;
    const heightPercent = dh === null || z1 === null || z1 === 0 ? null : (dh / Math.abs(z1)) * 100;

    segments.push({
      index: i,
      from: a,
      to: b,
      distance_m: Number(dist.toFixed(3)),
      delta_elevation_m: dh === null ? null : Number(dh.toFixed(3)),
      slope_percent: slope === null ? null : Number(slope.toFixed(4)),
      height_change_percent: heightPercent === null ? null : Number(heightPercent.toFixed(4))
    });

    totalDist += dist;
    if (dh !== null) {
      if (dh > 0) totalGain += dh;
      else totalLoss += dh;
    }
  }

  const startElevation = getElevForIndex(coords[0], 0, props);
  const endElevation = getElevForIndex(coords[coords.length - 1], coords.length - 1, props);
  const totalHeightChangePercent = startElevation === null || endElevation === null || startElevation === 0
    ? null
    : ((endElevation - startElevation) / Math.abs(startElevation)) * 100;

  return {
    type: 'Feature',
    geometry: feature.geometry,
    properties: Object.assign({}, props, {
      segments,
      total_distance_m: Number(totalDist.toFixed(3)),
      total_elevation_gain_m: Number(totalGain.toFixed(3)),
      total_elevation_loss_m: Number(totalLoss.toFixed(3)),
      start_elevation_m: startElevation === null ? null : Number(startElevation.toFixed(3)),
      end_elevation_m: endElevation === null ? null : Number(endElevation.toFixed(3)),
      total_height_change_percent: totalHeightChangePercent === null ? null : Number(totalHeightChangePercent.toFixed(4))
    })
  };
}

function processGeoJSON(data) {
  const collection = { type: 'FeatureCollection', features: [] };
  const errors = [];

  if (!data || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
    throw new Error('GeoJSON must be a FeatureCollection with a features array.');
  }

  for (const feature of data.features) {
    const processed = processFeature(feature);
    if (processed) {
      collection.features.push(processed);
    } else {
      errors.push(feature.id || feature.properties?.name || 'unknown feature');
    }
  }

  return { collection, errors };
}

function formatSummary(result, errors) {
  const featureCount = result.features.length;
  const totalDistance = result.features.reduce((sum, feature) => sum + (feature.properties.total_distance_m || 0), 0);
  const totalGain = result.features.reduce((sum, feature) => sum + (feature.properties.total_elevation_gain_m || 0), 0);
  const totalLoss = result.features.reduce((sum, feature) => sum + (feature.properties.total_elevation_loss_m || 0), 0);
  const percentLines = result.features.map((feature, index) => {
    const title = feature.properties.name || feature.id || `feature ${index + 1}`;
    const percent = feature.properties.total_height_change_percent;
    return `  - ${title}: ${percent === null ? 'n/a' : `${percent.toFixed(4)}%`}`;
  }).join('\n');

  return `Processed features: ${featureCount}\n` +
         `Total distance: ${totalDistance.toFixed(3)} m\n` +
         `Total elevation gain: ${totalGain.toFixed(3)} m\n` +
         `Total elevation loss: ${totalLoss.toFixed(3)} m\n` +
         `Height change percent by feature:\n${percentLines}\n` +
         (errors.length ? `Skipped unsupported features: ${errors.join(', ')}` : 'All features processed successfully.');
}

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const fileInput = document.getElementById('geojson-file');
const statusDiv = document.getElementById('status');
const summaryPre = document.getElementById('summary');
const downloadButton = document.getElementById('download-button');
let latestResult = null;

downloadButton.disabled = true;

fileInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) {
    statusDiv.textContent = 'No file selected.';
    summaryPre.textContent = 'Upload a GeoJSON file to see results.';
    downloadButton.disabled = true;
    latestResult = null;
    return;
  }

  statusDiv.textContent = `Reading ${file.name}...`;
  downloadButton.disabled = true;
  latestResult = null;

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    const { collection, errors } = processGeoJSON(data);
    latestResult = collection;

    summaryPre.textContent = formatSummary(collection, errors);
    statusDiv.textContent = `File processed: ${file.name}`;
    downloadButton.disabled = false;
  } catch (err) {
    statusDiv.textContent = 'Error processing file.';
    summaryPre.textContent = err.message;
    latestResult = null;
    downloadButton.disabled = true;
  }
});

downloadButton.addEventListener('click', () => {
  if (!latestResult) return;
  downloadJSON(latestResult, 'geojson-distance-elevation-result.geojson');
});
