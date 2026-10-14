// HOW TO RUN (the map tools are deliberately not project dependencies):
//   mkdir /tmp/mapgen && cd /tmp/mapgen && npm i d3-geo topojson-client world-atlas
//   cp <repo>/scripts/map/make-world-map.mjs . && node make-world-map.mjs 110m world-map.svg
//   → copy world-map.svg to public/ICSDC_Frontend/assets/images/, and copy the printed
//     scale/tx/ty/H into GEO_MAP in public/ICSDC_Frontend/assets/js/utils/geo-map.js.
// Generates world-map.svg in the Natural Earth projection from Natural Earth
// country outlines (world-atlas), plus the projection constants the browser
// uses to place pins exactly. Antarctica is left out, as in the old map.
import fs from 'fs';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';

const RES = process.argv[2] || '50m';
const OUT = process.argv[3];
const W = 2000;

const topo = JSON.parse(fs.readFileSync(`node_modules/world-atlas/countries-${RES}.json`, 'utf8'));
const fc = feature(topo, topo.objects.countries);
fc.features = fc.features.filter((f) => f.properties.name !== 'Antarctica');

const projection = geoNaturalEarth1().fitWidth(W, fc);
const [[, y0], [, y1]] = geoPath(projection).bounds(fc);
const pad = 8;
projection.translate([projection.translate()[0], projection.translate()[1] - y0 + pad]);
const H = Math.ceil(y1 - y0 + 2 * pad);

const path = geoPath(projection).digits(1);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const paths = fc.features
  .map((f) => {
    const d = path(f);
    return d ? `<path data-name="${esc(f.properties.name)}" d="${d}"/>` : '';
  })
  .filter(Boolean);

const [tx, ty] = projection.translate();
const k = projection.scale();
const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMidYMid meet" fill="#B8C9DF" ` +
  `data-projection="naturalEarth1" data-scale="${k}" data-tx="${tx}" data-ty="${ty}">\n` +
  `<!-- Natural Earth 1 projection, Natural Earth country outlines (public domain) via world-atlas ${RES}. ` +
  `Generated, do not hand-edit: pins are placed by projecting latitude/longitude with the constants above ` +
  `(GEO_MAP in homepage-cms.js / dedicated-server.js must match). -->\n` +
  paths.join('\n') + '\n</svg>\n';

fs.writeFileSync(OUT, svg);
console.log(JSON.stringify({ res: RES, W, H, scale: k, tx, ty, bytes: svg.length, countries: paths.length }));
