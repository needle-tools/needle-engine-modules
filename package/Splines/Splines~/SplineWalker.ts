import { Behaviour, GameObject } from "needle.tiny.engine/engine-components/Component";
import { Mathf } from "needle.tiny.engine/engine/engine_math";
import { serializeable } from "needle.tiny.engine/engine/engine_serialization_decorator";
import { Object3D } from "three"
import { Camera } from "needle.tiny.engine/engine-components/Camera";
import { getWorldPosition, getWorldQuaternion, setWorldPosition } from "needle.tiny.engine/engine/engine_three_utils";
import { SplineContainer } from "./SplineContainer";



export class SplineWalker extends Behaviour {

    //@type(UnityEngine.Splines.SplineContainer)
    @serializeable(SplineContainer)
    spline: SplineContainer | null = null;
    @serializeable(Object3D)
    object?: THREE.Object3D;
    @serializeable()
    speed: number = 0;
    @serializeable(Object3D)
    lookAt: THREE.Object3D | null = null;
    @serializeable()
    clamp: boolean = false;

    private _position01: number = 0;
    private _targetPosition01: number = 0;

    setPosition(t: number, animate: boolean = true) {
        this._targetPosition01 = t;
        if (!animate) {
            this._position01 = t;
            this.updateFromPosition();
        }
    }

    awake() {
        this._targetPosition01 = this._position01;
        this._position01 = this._targetPosition01;
    }

    onEnable() {
        this.startCoroutine(this.internalUpdate());
    }

    private *internalUpdate() {
        while (true) {
            this.updateFromPosition();
            yield;
        }
    }

    private updateFromPosition() {
        if (!this.spline || !this.spline.curve) return;
        if (!this.object) return;

        if (this.speed !== 0)
            this._targetPosition01 += this.context.time.deltaTime * this.speed;
        if (this.clamp) this._targetPosition01 = Mathf.clamp01(this._targetPosition01);
        this._position01 = Mathf.lerp(this._position01, this._targetPosition01, this.context.time.deltaTime / .2);

        const t = this._position01 % 1;
        const pt = this.spline.getPointAt(t);
        setWorldPosition(this.object, pt);
        if (!this.lookAt) {
            const tan = this.spline.getTangentAt(t);
            this.object.lookAt(pt.add(tan));
        }
        else this.object.lookAt(getWorldPosition(this.lookAt));
    }
}