import * as THREE from "three"

export class ModelUtils {
    static getBounds(obj: THREE.Object3D, precise:boolean = false): THREE.Box3 {
        const box = new THREE.Box3();
        obj.traverseVisible((child: any) => {
            if (child.geometry) {
                box.expandByObject(child, precise);
            }
        });
        return box;
    }
}