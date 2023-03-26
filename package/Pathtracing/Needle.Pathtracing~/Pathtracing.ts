import { Behaviour, GameObject, OrbitControls, serializeable } from "@needle-tools/engine";
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import {
    PathTracingSceneGenerator,
    PathTracingRenderer,
    PhysicalPathTracingMaterial,
    MaterialReducer,
} from 'three-gpu-pathtracer';
import { PathTracingSceneWorker } from 'three-gpu-pathtracer/src/workers/PathTracingSceneWorker.js';
import { MeshBasicMaterial, CustomBlending, Object3D, DoubleSide, Camera } from 'three';
import { CameraTracker } from './CameraTracker';


// Documentation → https://docs.needle.tools/scripting

export class Pathtracing extends Behaviour {

    @serializeable()
    useWorker: boolean = true;

    private ptRenderer: PathTracingRenderer;
    private fsQuad: FullScreenQuad;
    private params: any;
    private delaySamples: number = 0;
    private sceneInfo: any;

    private _cameraTracker: CameraTracker = new CameraTracker();

    private enableRendering: boolean = false;

    toggleComponent() {
        this.enabled = !this.enabled;
    }

    awake() {

        this.params = {
            multipleImportanceSampling: true,
            acesToneMapping: true,
            resolutionScale: 1 / window.devicePixelRatio,
            tilesX: 2,
            tilesY: 2,
            samplesPerFrame: 1,
            // model: initialModel,
            // envMap: envMaps[ 'Royal Esplanade' ],

            gradientTop: '#bfd8ff',
            gradientBottom: '#ffffff',

            environmentIntensity: 1.0,
            environmentBlur: 0,
            environmentRotation: 0,

            cameraProjection: 'Perspective',

            backgroundType: 'Gradient',
            bgGradientTop: '#111111',
            bgGradientBottom: '#000000',
            backgroundAlpha: 1.0,
            checkerboardTransparency: true,

            enable: true,
            bounces: 3,
            filterGlossyFactor: 0.5,
            pause: false,

            floorColor: '#080808',
            floorOpacity: 1.0,
            floorRoughness: 0.1,
            floorMetalness: 0.0

        };

        const renderer = this.context.renderer;
        const params = this.params;

        this.ptRenderer = new PathTracingRenderer(renderer);
        const ptRenderer = this.ptRenderer;
        ptRenderer.camera = this.context.mainCamera;
        ptRenderer.alpha = true;
        ptRenderer.material = new PhysicalPathTracingMaterial();
        ptRenderer.tiles.set(params.tilesX, params.tilesY);
        ptRenderer.material.setDefine('FEATURE_MIS', Number(params.multipleImportanceSampling));
        // ptRenderer.material.backgroundMap = backgroundMap;

        /*
        // load the envmap and model
        const envMapPromise = new RGBELoader()
        .loadAsync( 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/master/hdri/chinese_garden_1k.hdr' )
        .then( texture => {

            texture.mapping = EquirectangularReflectionMapping;
            // scene.background = texture;
            // scene.environment = texture;
            ptRenderer.material.envMapInfo.updateFrom( texture );

        } );
        */

        this.fsQuad = new FullScreenQuad(new MeshBasicMaterial({
            map: ptRenderer.target.texture,
            blending: CustomBlending,
            premultipliedAlpha: renderer.getContextAttributes().premultipliedAlpha,
        }));

        const upd = this._update.bind(this);
        this.context.post_render_callbacks.push(upd);

        window.addEventListener('resize', this.onResize.bind(this));
    }

    private onResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const scale = this.params.resolutionScale;
        const dpr = window.devicePixelRatio;
        this.ptRenderer.setSize(w * scale * dpr, h * scale * dpr);
        this.ptRenderer.reset();
    }

    private resetRenderer() {
        const params = this.params;
        const ptRenderer = this.ptRenderer;

        if (params.tilesX * params.tilesY !== 1.0) {
            this.delaySamples = 1;
        }
        ptRenderer.reset();
    }

    async onEnable() {
        console.log(this.ptRenderer);
        this.onResize();
        this.ptRenderer.material.envMapInfo.updateFrom(this.context.scene.environment);
        this.updateModel(this.gameObject);
    }

    onDisable() {
        this.enableRendering = false;
    }

    private _lastTimeChanged: number = 0;
    onBeforeRender(_frame: XRFrame | null): void {
        if (this._cameraTracker.testChanged(this.context.mainCamera)) {
            this._lastTimeChanged = this.context.time.realtimeSinceStartup;
        }
        if (this._lastTimeChanged !== 0 && this.context.time.realtimeSinceStartup - this._lastTimeChanged < 0.1) {
            this.resetRenderer();
        }
        else this._lastTimeChanged = 0;
    }

    private async updateModel(model: Object3D) {
        const renderer = this.context.renderer;
        const scene = this.context.scene;

        model.traverse(c => {
            if (c.material) {
                // set the thickness so we render the material as a volumetric object
                c.material.thickness = 1.0;
                c.material.side = DoubleSide;
            }
        });

        const reducer = new MaterialReducer();
        reducer.process(model);

        let generator: any;
        let result: any;

        if (this.useWorker) {
            generator = new PathTracingSceneWorker();
            console.log(model);

            result = await generator.generate(model, {
                onProgress: v => {
                    const percent = Math.floor(100 * v);
                    console.log(`Building BVH : ${percent}%`);

                }
            });
        }
        else {
            generator = new PathTracingSceneGenerator();
            result = generator.generate(model);
        }

        this.sceneInfo = result;
        scene.add(this.sceneInfo.scene);

        const { bvh, textures, materials } = result;
        const geometry = bvh.geometry;
        const material = this.ptRenderer.material;

        material.bvh.updateFrom(bvh);
        material.attributesArray.updateFrom(
            geometry.attributes.normal,
            geometry.attributes.tangent,
            geometry.attributes.uv,
            geometry.attributes.color,
        );
        material.materialIndexAttribute.updateFrom(geometry.attributes.materialIndex);
        material.textures.setTextures(renderer, 2048, 2048, textures);
        material.materials.updateFrom(materials, textures);

        if (this.useWorker)
            generator.dispose();

        this.ptRenderer.reset();

        this.enableRendering = true;
    }

    private _update() {
        if (!this.enableRendering)
            return;

        const ptRenderer = this.ptRenderer;
        const params = this.params;

        if (ptRenderer.samples < 1.0 || !params.enable) {

            // regular rendering
            // GameObject.setActive(this.context.mainCamera!, true);

        }
        if (params.enable && this.delaySamples === 0) {

            // GameObject.setActive(this.context.mainCamera!, false);

            const activeCamera = this.context.mainCamera!;
            const renderer = this.context.renderer;
            const fsQuad = this.fsQuad;

            const samples = Math.floor(ptRenderer.samples);
            // console.log(`samples: ${ samples }`);

            ptRenderer.material.materials.updateFrom(this.sceneInfo.materials, this.sceneInfo.textures);
            ptRenderer.material.filterGlossyFactor = params.filterGlossyFactor;
            ptRenderer.material.environmentIntensity = params.environmentIntensity;
            ptRenderer.material.bounces = params.bounces;
            ptRenderer.material.physicalCamera.updateFrom(activeCamera);
            ptRenderer.camera = activeCamera;

            activeCamera.updateMatrixWorld();

            if (!params.pause || ptRenderer.samples < 1) {

                for (let i = 0, l = params.samplesPerFrame; i < l; i++) {

                    ptRenderer.update();

                }

            }

            renderer.autoClear = false;
            fsQuad.render(renderer);
            renderer.autoClear = true;

        } else if (this.delaySamples > 0) {

            this.delaySamples--;

        }
    }
}