import { parseSync } from "@needle-tools/engine/engine/engine_scenetools";
import { Context } from "@needle-tools/engine/engine/engine_setup";
import { DriveApi } from "./DriveApi";
import { DriveClient } from "./DriveClient";
import { FilePromise, LoadedGLTF } from "./DriveFileAccess";
import { FileCancellation } from "./FileCancellation";




export class DriveFilePicker {
    private client : DriveClient;
    private api: DriveApi;
    private context: Context;
    private filePicker: any = undefined;

    private isVisible: boolean = false;
    private _filePickPromise? : FilePromise;
    private _filePickCancel?:FileCancellation;

    private get google() {
        return this.api.google;
    }

    constructor(client:DriveClient, api: DriveApi, context: Context) {
        this.client = client;
        this.api = api;
        this.context = context;
    }

    async openFilePicker(token? : FileCancellation) {

        if (this.isVisible) return;
        this.isVisible = true;

        if (!this.google.picker) {
            await new Promise((res, _) => {
                this.api.gapi.load('picker', () => {
                    res(null);
                });
            });
        }

        const accessToken = this.api.getAccessToken();
        if (accessToken && !this.filePicker) {
            const view = new this.google.picker.View(this.google.picker.ViewId.DOCS);
            // view.setMimeTypes("model/gltf-binary");
            // view.setMode(this.google.picker.DocsViewMode.LIST);
            view.setQuery("*.glb");
            this.filePicker = new this.google.picker.PickerBuilder()
                .enableFeature(this.google.picker.Feature.NAV_HIDDEN)
                // .enableFeature(this.google.picker.Feature.MULTISELECT_ENABLED)
                .setOAuthToken(accessToken)
                .setDeveloperKey(this.api.apiKey)
                .addView(view)
                .setCallback(this.pickerCallback.bind(this))
                .setSize(window.innerWidth * .9, window.innerHeight * .9)
                .build();
        }
        
        // cancel in-flight request
        this._filePickCancel?.cancel();
        this._filePickPromise?.resolve(null);

        this.filePicker?.setVisible(true);
        this._filePickCancel = token;
        return this._filePickPromise = FilePromise.create();
    }

    private async pickerCallback(data) {
        // console.log(data, data?.action?.cancel);

        if(data?.action === "cancel")
        {
            window.focus();
            this.isVisible = false;
            this.filePicker?.setVisible(false);
            this._filePickPromise?.resolve(null);
        } 
        else if (data[this.google.picker.Response.ACTION] == this.google.picker.Action.PICKED) {
            this.isVisible = false;
            this.filePicker?.setVisible(false);
            window.focus();

            const doc = data[this.google.picker.Response.DOCUMENTS][0];
            // const desc = doc[this.google.picker.Document.DESCRIPTION];
            const fileName = doc[this.google.picker.Document.NAME];
            if (!fileName || (!fileName.endsWith(".glb") && !fileName.endsWith(".gltf"))) {
                console.error("Only gltf or glb files are supported but selected: " + fileName);
                return;
            }
            // const url = doc[this.google.picker.Document.URL];
            const fileId = doc[this.google.picker.Document.ID];

            // todo: download and this should be moved out, we should only provide file info here
            this.client.networking?.file.onSendOpenedFile(fileId, fileName, this.context.scene);
            this.client.models.onClearPreviousFiles();

            const file = await this.client.access?.downloadFile(fileId, this._filePickCancel);
            if (file) {
                this._filePickPromise?.resolve(file);
                
                // if (loaded?.scene) {
                //     this.context.scene.add(loaded.scene);
                // }


        
                // await delay(100);
                // const meta = new DriveFileMeta(this.context, this.api);

                // const fileMeta = { appProperties: { test: "test" }, properties: { test: "test prop 1000", nested: { number: 333 } } };
                // DriveFileMeta.AddThumbnailObjectFromBase64(fileMeta, ScreenshotUtils.TakeScreenshotBase64(this.context));

                // await meta.updateMeta(fileId, fileMeta);

                // console.log(await meta.getMeta(fileId));

            }
            else {
                if(this._filePickCancel?.cancellationRequested){
                    this._filePickPromise?.resolve(null)
                }
                else
                    console.error("Downloading file failed", data);
            }
        }
    }
}


// export const dataUrlToBlob = async(base64DataUrl: string): Promise<Blob> => {
//     return new Promise((resolve, reject) => {
//       const sliceSize = 512;
//       const typeMatch = base64DataUrl.match(/data:(.*);/);
  
//       if (!typeMatch) {
//         return reject(new Error(`${base64DataUrl} is not a valid data Url`));
//       }
  
//       const type = typeMatch[1];
//       const base64 = base64DataUrl.replace(/data:image\/\w+;base64,/, '');
  
//       const byteCharacters = atob(base64);
//       const byteArrays = [];
  
//       for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
//         const slice = byteCharacters.slice(offset, offset + sliceSize);
  
//         const byteNumbers = new Array(slice.length);
//         for (let i = 0; i < slice.length; i++) {
//           byteNumbers[i] = slice.charCodeAt(i);
//         }
  
//         const byteArray = new Uint8Array(byteNumbers);
//         byteArrays.push(byteArray);
//       }
  
//       resolve(new Blob(byteArrays, {type}));
//     });
//   };
  