import { useEffect, useState } from 'react';
import { Polyline, useMap } from 'react-leaflet';

export default function RoadRoute({ pickup, destination }) {
  const [route, setRoute] = useState([]);
  const [error, setError] = useState('');
  const map = useMap();

  useEffect(() => {
    let cancelled = false;

    async function loadRoute() {
      setRoute([]);
      setError('');
      if (!pickup || !destination) return;

      try {
        const url =
          'https://router.project-osrm.org/route/v1/driving/' +
          `${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}` +
          '?overview=full&geometries=geojson';

        const response = await fetch(url);
        if (!response.ok) throw new Error();

        const data = await response.json();
        if (data.code !== 'Ok' || !data.routes?.length) throw new Error();

        if (!cancelled) {
          setRoute(data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]));
        }
      } catch {
        if (!cancelled) setError('Driving route unavailable. Please try again later.');
      }
    }

    loadRoute();
    return () => { cancelled = true; };
  }, [pickup?.lat, pickup?.lng, destination?.lat, destination?.lng]);

  useEffect(() => {
    if (route.length > 1) map.fitBounds(route, { padding: [35, 35] });
  }, [route, map]);

  return (
    <>
      {route.length > 1 && (
        <Polyline
          positions={route}
          pathOptions={{ color: '#EA580C', weight: 6, opacity: 0.85 }}
        />
      )}
      {error && (
        <div style={{ background: 'white', padding: 8, borderRadius: 8, marginTop: 8 }}>
          {error}
        </div>
      )}
    </>
  );
}
