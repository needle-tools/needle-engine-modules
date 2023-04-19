import { Camera, Matrix4, Vector3, Quaternion } from "three";

const tempPos = new Vector3();
const tempQuat = new Quaternion();
const tempScale = new Vector3();

export class CameraTracker {

    private _camera: Camera;
    private _previousPosition = new Vector3();
    private _previousQuaternion = new Quaternion();
    private _previousNear = 0;
    private _previousFar = 0;
    private _previousFov = 0;

    testChanged(camera: Camera): boolean {

        if (this._camera !== camera) {
            this._camera = camera;
            this.copy(camera);
            return true;
        }

        // First check the cheap ones
        if (Math.abs(camera.near - this._previousNear) > 0.001) {
            this.copy(camera);
            return true;
        }
        else if (Math.abs(camera.far - this._previousFar) > 0.001) {
            this.copy(camera);
            return true;
        }
        else if (Math.abs(camera.fov - this._previousFov) > 0.001) {
            this.copy(camera);
            return true;
        }

        camera.matrixWorld.decompose(tempPos, tempQuat, tempScale);

        if (tempPos.distanceTo(this._previousPosition) > 0.05) {
            this.copy(camera, tempPos, tempQuat);
            return true;
        }
        else if (tempQuat.angleTo(this._previousQuaternion) > 0.01) {
            this.copy(camera, tempPos, tempQuat);
            return true;
        }

        return false;

    }

    private copy(cam: Camera, pos?: Vector3, quat?: Quaternion) {
        this._camera = cam;
        if (!pos || !quat)
            cam.matrixWorld.decompose(this._previousPosition, this._previousQuaternion, tempScale);
        else {
            this._previousPosition.copy(pos)
            this._previousQuaternion.copy(quat);
        }
        this._previousNear = cam.near;
        this._previousFar = cam.far;
        this._previousFov = cam.fov;
    }
}
