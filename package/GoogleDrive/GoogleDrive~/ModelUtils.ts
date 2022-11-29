import { Object3D, Box3} from "three"

export class ModelUtils {
    static getBounds(obj: Object3D, precise:boolean = false): Box3 {
        const box = new Box3();
        obj.traverseVisible((child: any) => {
            if (child.geometry) {
                box.expandByObject(child, precise);
            }
        });
        return box;
    }
}