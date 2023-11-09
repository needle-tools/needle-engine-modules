import { GameObject, SyncedTransform } from "@needle-tools/engine";
// import { onDynamicObjectAdded } from "@needle-tools/engine";
import { tryFindObject } from "@needle-tools/engine";
import { Context } from "@needle-tools/engine";

import { Box3, BoxGeometry, BoxHelper, Color, Mesh, MeshBasicMaterial, MeshNormalMaterial, Object3D, Vector3 } from "three";

import { DriveClient } from "./DriveClient";
import { LoadedGLTF } from "./DriveFileAccess";
import { UserOpenedFileModel } from "./networking/DriveSyncedFile";
import { ModelUtils } from "./ModelUtils";

export class DriveModelFileManager {
    constructor(client: DriveClient) {
        this._client = client;
        this._filePreview = new FilePreviewRenderer(client.context);
        // this._filePreview.show();
    }

    private _client: DriveClient;
    private _previousFiles: LoadedGLTF[] = [];
    private _filePreview: FilePreviewRenderer;

    onCreateFile(file: LoadedGLTF | null | undefined) {
        this.hideFilePreview();
        if (!file) return;
        if (!file.root.scene) return;

        this.removePreviouslyCreatedFiles();
        this._previousFiles.push(file);
        const root = file.root.scene;
        this._client.gameObject.add(root);
        this.postProcessFile(root, file);
    }

    onCreateFileFromModel(model: UserOpenedFileModel, file: LoadedGLTF) {
        this.removePreviouslyCreatedFiles();
        this.hideFilePreview();
        this._previousFiles.push(file);
        const root = file.root?.scene;
        const context = this._client.context;
        const parent = tryFindObject(model.parentGuid, context.scene, true, false) ?? this._client.gameObject;
        parent.add(root);
        this.postProcessFile(root, file);
    }

    onClearPreviousFiles() {
        this.removePreviouslyCreatedFiles();
    }

    showFilePreview(fileName: string, worldPosition?: Vector3, worldScale?: Vector3) {
        this._filePreview.show(fileName, worldPosition, worldScale);
    }

    updateFilePreview(download01: number) {
        this._filePreview.updateProgress(download01);
    }

    private hideFilePreview() {
        this._filePreview?.hide();
    }

    private postProcessFile(root: Object3D, file: LoadedGLTF) {
        if (file.idProvider) {
            // onDynamicObjectAdded(root, file.idProvider);
        }

        const st = GameObject.getComponentsInChildren(root, SyncedTransform);
        for(const s of st) s.syncDestroy = false;


        const bounds : Box3 = ModelUtils.getBounds(root, false);
        const center = bounds.getCenter(new Vector3());
        const size = bounds.getSize(new Vector3());
        const maxComponent = Math.max(size.x, size.y, size.z);
        if(maxComponent > .1) return;
        const targetBoxSize = 1;
        const normalizedScale = 1 / maxComponent;
        const scale = normalizedScale * targetBoxSize;
        console.log("Normalize scale", root, size, scale);
        root.position.sub(center.multiplyScalar(scale));
        root.scale.multiplyScalar(scale);
        
        const parent = new Object3D();
        root.parent.add(parent);
        parent.add(root);
    }

    private removePreviouslyCreatedFiles() {
        for (const file of this._previousFiles) {
            GameObject.destroy(file.root.scene);
        }
        this._previousFiles.length = 0;
    }
}


class FilePreviewRenderer {

    private context: Context;

    private root: Object3D | null = null;
    private bounds: Object3D;
    private progressObject: Object3D;

    private normalColor: any = 0x333333;
    private awaitAccessColor: any = 0xc1b044;

    constructor(context: Context) {
        this.context = context;
        this.root = new Object3D();
        const geo = new BoxGeometry();
        const col = new Color(this.normalColor);
        const object = new Mesh(geo, new MeshBasicMaterial({ color: col }));
        this.bounds = new BoxHelper(object, col);
        this.root.add(this.bounds);
        this.root.position.y = this.root.scale.y * .5;

        const progressMat = new MeshNormalMaterial({ color: col });
        progressMat.opacity = .2;
        progressMat.transparent = true;
        this.progressObject = new Mesh(geo, progressMat);
        this.progressObject.scale.set(1, 0, 1);
        this.bounds.add(this.progressObject);
    }

    show(name: string, position?: Vector3, scale?: Vector3) {
        this.bounds.material.color.set(this.awaitAccessColor);
        this.context.scene.add(this.root);
        this.updateProgress(0);
    }

    hide() {
        this.root.removeFromParent();
    }

    updateProgress(t01: number) {
        this.progressObject.visible = t01 > 0;
        this.progressObject.position.y = -.5 + t01 * .5;
        this.progressObject.scale.set(1, t01, 1);
        if (t01 > 0)
            this.bounds.material.color.set(this.normalColor);
    }
}
