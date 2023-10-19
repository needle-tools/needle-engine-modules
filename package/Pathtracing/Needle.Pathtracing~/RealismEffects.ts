import { Behaviour, EffectProviderResult, PostProcessingEffect, registerCustomEffectType } from "@needle-tools/engine"
import * as POSTPROCESSING from "postprocessing"
import { SSGIEffect, TRAAEffect, MotionBlurEffect, VelocityDepthNormalPass, SSAOEffect, HBAOEffect } from "realism-effects"

export class RealismEffects extends PostProcessingEffect {

    get typeName() {
        return "RealismEffects";
    }

    onCreateEffect(): EffectProviderResult {
        const renderer = this.context.renderer;
        const scene = this.context.scene;
        const camera = this.context.mainCamera;
        // const composer = this.context.composer;

        const composer = new POSTPROCESSING.EffectComposer(renderer)
        this.context.composer = composer;

        const velocityDepthNormalPass = new VelocityDepthNormalPass(scene, camera)
        // composer.addPass(velocityDepthNormalPass)

        // SSGI
        const ssgiEffect = new SSGIEffect(scene, camera, velocityDepthNormalPass, {})

        // TRAA
        const traaEffect = new TRAAEffect(scene, camera, velocityDepthNormalPass)

        // Motion Blur
        const motionBlurEffect = new MotionBlurEffect(velocityDepthNormalPass)

        // SSAO
        const ssaoEffect = new SSAOEffect(composer, camera, scene)

        // HBAO
        const hbaoEffect = new HBAOEffect(composer, camera, scene)

        const effectPass = new POSTPROCESSING.EffectPass(camera, ssgiEffect, hbaoEffect, ssaoEffect, traaEffect, motionBlurEffect)

        // composer.addPass(effectPass)


        const arr = new Array();
        arr.push(velocityDepthNormalPass);
        arr.push(effectPass);
        /*
        arr.push(ssgiEffect);
        arr.push(hbaoEffect);
        arr.push(ssaoEffect);
        arr.push(traaEffect);
        arr.push(motionBlurEffect);
        */
        return arr;
    }
}

registerCustomEffectType("RealismEffects", RealismEffects);