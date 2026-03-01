import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix marker-icon paths for CRA / Webpack
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon   from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl:       markerIcon,
  shadowUrl:     markerShadow,
});

interface LocationMapProps {
  lat: number;
  lng: number;
  height?: string;          // default “300px”
}

const LocationMap: React.FC<LocationMapProps> = ({ lat, lng, height = '300px' }) => {
  const pos: LatLngExpression = [lat, lng];
  const AnyMap = MapContainer as any;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore – temp workaround for react-leaflet typing lag
  return (
    <AnyMap center={pos} zoom={13} scrollWheelZoom={false} style={{ height, width: '100%' }}>
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore */}
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore */}
      <Marker position={pos as [number, number]}>
        <Popup>Service location</Popup>
      </Marker>
    </AnyMap>
  );
};

export default LocationMap;
