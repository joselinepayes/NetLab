import { lazy } from 'react'

// Registro de módulos. Para añadir un simulador nuevo (CRC, checksum, VLAN…):
// 1) crea src/modules/<nombre>/index.jsx  2) agrégalo aquí con status: 'ready'.
// No hay que tocar el resto de la aplicación.
export const MODULES = [
  {
    id: 'convolutional',
    name: 'Codificación convolucional',
    short: 'Convolucional',
    status: 'ready',
    component: lazy(() => import('./convolutional/index.jsx')),
  },
  { id: 'crc', name: 'CRC y división binaria (XOR)', status: 'soon' },
  { id: 'checksum', name: 'Checksum y suma con acarreo', status: 'soon' },
  { id: 'parity2d', name: 'Paridad bidimensional', status: 'soon' },
  { id: 'topologies', name: 'Topologías de red', status: 'soon' },
  { id: 'vlan', name: 'VLAN', status: 'soon' },
  { id: 'domains', name: 'Dominios de broadcast y colisión', status: 'soon' },
  { id: 'switching', name: 'Switching y tabla MAC/CAM', status: 'soon' },
]
