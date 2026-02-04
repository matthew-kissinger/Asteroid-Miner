import * as THREE from 'three';

export class MeshComponent {
  mesh: THREE.Object3D;
  visible: boolean;
  castShadow: boolean;
  receiveShadow: boolean;
  entity?: any;

  constructor(
    geometry?: THREE.BufferGeometry | THREE.Object3D | null,
    material?: THREE.Material | THREE.Material[] | null
  );

  onAttached(): void;
  onDetached(): void;
  setVisible(visible: boolean): void;
  isVisible(): boolean;
  setCastShadow(castShadow: boolean): void;
  setReceiveShadow(receiveShadow: boolean): void;
  setMaterial(material: THREE.Material | THREE.Material[]): void;
  setGeometry(geometry: THREE.BufferGeometry): void;
  addToScene(scene: THREE.Scene): void;
  updateFromTransform(): void;
}
