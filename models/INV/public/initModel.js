UB.inject('clientRequire/leaflet/dist/leaflet.css');
UB.inject('clientRequire/leaflet-draw/dist/leaflet.draw.css');
UB.inject('clientRequire/leaflet.markercluster/dist/MarkerCluster.css');
UB.inject('clientRequire/leaflet.markercluster/dist/MarkerCluster.Default.css');

require('leaflet');
require('leaflet-draw');
require('leaflet-editable');
require('leaflet.markercluster');
require('proj4leaflet');
L.WMS = require('leaflet.wms');

require('./shortcuts/INV_factory.js');
require('./AccessManager.js');
require('./services.js');


window.landPlotNotOwn = require('./geoJSON/landPlotNotOwn.geojson')()
window.landPlotOwn = require('./geoJSON/landPlotOwn.geojson')()
