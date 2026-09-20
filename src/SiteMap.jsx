import { MapContainer, TileLayer, Rectangle, Tooltip, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import { BASEMAP, SPLIT_STYLE } from './config'

// sites.json stores footprints as [minLon, minLat, maxLon, maxLat]; Leaflet
// wants [[south, west], [north, east]].
const toBounds = (f) => [[f[1], f[0]], [f[3], f[2]]]

function FlyTo({ site }) {
  const map = useMap()
  useEffect(() => {
    if (site) map.flyToBounds(toBounds(site.footprint_wgs84), { padding: [60, 60], duration: .6 })
  }, [site, map])
  return null
}

export default function SiteMap({ sites, selected, onSelect }) {
  return (
    <MapContainer center={[-29.0, 24.5]} zoom={5} scrollWheelZoom
                  zoomControl={false} className="leaflet-container">
      <TileLayer url={BASEMAP.url} attribution={BASEMAP.attribution} />
      {sites.map((s) => {
        const st = SPLIT_STYLE[s.split]
        const on = selected?.id === s.id
        return (
          <Rectangle
            key={s.id}
            bounds={toBounds(s.footprint_wgs84)}
            pathOptions={{
              color: st.color,
              weight: on ? st.weight + 2 : st.weight,
              fillColor: st.color,
              fillOpacity: on ? st.fill + 0.2 : st.fill,
            }}
            eventHandlers={{ click: () => onSelect(s) }}
          >
            <Tooltip direction="top" opacity={0.95}>
              <strong>{s.city ?? s.biome}</strong><br />
              {s.biome} · {s.urbanisation}<br />
              {s.n_tiles} tiles · {st.label}
            </Tooltip>
          </Rectangle>
        )
      })}
      <FlyTo site={selected} />
    </MapContainer>
  )
}
