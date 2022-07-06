import { Context } from "needle.tiny.engine/engine/engine_setup";


let blobCanvas: HTMLCanvasElement | undefined;

export class ScreenshotUtils {

    static TakeScreenshotBase64(context: Context, width: number = 1024, height?: number) {
        if (!blobCanvas) blobCanvas = document.createElement('canvas');
        const canvasContext = blobCanvas.getContext('2d');
        blobCanvas.width = width;
        blobCanvas.height = height ?? width;
        const size = Math.min(context.domWidth, context.domHeight, blobCanvas.width, blobCanvas.width);
        const px = (context.domWidth - size) / 2;
        const py = (context.domHeight - size) / 2;
    
        context.renderer.render(context.scene, context.mainCamera!);
        canvasContext!.drawImage(
            context.renderer.domElement,
            px,
            py,
            size,
            size,
            0,
            0,
            blobCanvas.width,
            blobCanvas.height
        );
        return blobCanvas.toDataURL();
    }
} 