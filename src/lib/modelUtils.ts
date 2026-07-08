import * as THREE from "three";

/**
 * Clone a GLB node, recenter it so its base sits at y=0 and it's centered on
 * x/z, then scale it uniformly to `targetHeight`. Returns a fresh Group ready
 * to drop onto a pot. Geometry/materials stay shared (clone is cheap); only the
 * transform is unique per instance.
 */
export function normalizeModel(src: THREE.Object3D, targetHeight: number): THREE.Group {
  const obj = src.clone(true);
  obj.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.castShadow = true;
      mesh.receiveShadow = false;
      mesh.frustumCulled = false;
    }
  });
  const group = new THREE.Group();
  group.add(obj);
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  obj.position.x -= center.x;
  obj.position.z -= center.z;
  obj.position.y -= box.min.y;
  group.scale.setScalar(targetHeight / (size.y || 1));
  return group;
}
