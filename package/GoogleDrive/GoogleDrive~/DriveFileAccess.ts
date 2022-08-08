import { parseSync } from "@needle-tools/engine/engine/engine_scenetools";
import { BaseApiProvider } from "./BaseApiProvider";
import { DriveClient } from "./DriveClient";
import { GLTF } from "three/examples/js/loaders/GLTFLoader";
import { InstantiateIdProvider } from "@needle-tools/engine/engine/engine_networking_instantiate";
import { FileCancellation } from "./FileCancellation";
import { getParam } from "@needle-tools/engine/engine/engine_utils";
import { NEEDLE_KHR_ANIMATION_POINTER_NAME } from "@needle-tools/engine/engine/extensions/KHR_animation_pointer";
import { NEEDLE_persistent_assets } from "@needle-tools/engine/engine/extensions/NEEDLE_persistent_assets";

const debug = getParam("debugdrive");

export class LoadedGLTF {
    id: string;
    name: string;
    root: GLTF;
    idProvider: InstantiateIdProvider;

    constructor(id: string, name: string, root: GLTF, seed: InstantiateIdProvider) {
        this.id = id;
        this.name = name;
        this.root = root;
        this.idProvider = seed;
    }
}

export class FilePromise extends Promise<LoadedGLTF | null> {

    static create(): FilePromise {
        let resolve, reject;
        const filePromise = new FilePromise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        filePromise._resolve = resolve;
        filePromise._reject = reject;
        return filePromise;
    }

    _resolve?: Function;
    _reject?: Function;

    constructor(executor) {
        super(executor);
    }
    resolve(pickedFile: LoadedGLTF | null) {
        this._resolve?.call(this, pickedFile);
    }
    reject() {
        this._reject?.call(this);
    }
}


declare type ProgressCallbackArgs = { file, loaded: number, total: number, progress: number };
declare type ProgressCallback = (args: ProgressCallbackArgs) => void;

export declare type Permission = {
    id: string,
    type: string,
    kind: string,
    role: string,
    emailAddress?: string,
    displayName?: string,
    photoLink?: string,
}

export class DriveFileAccess extends BaseApiProvider {

    constructor(client: DriveClient) {
        super(client);
    }

    async findFile(id: string, fields = "name,id,mimeType,size,capabilities,linkShareMetadata") {
        try {

            let res = await this.api?.gapi.client.drive.files.get({
                fileId: id,
                fields: fields
            });
            return res?.result ?? res;;
        }
        catch (err) {
            if (debug)
                console.warn(err);
        }
        return null;
    }

    async getPermission(fileId: string): Promise<Permission[] | null> {
        try {

            const per = await this.api?.gapi.client.drive.permissions.list({
                fileId: fileId,
                fields: "*"
            })
            if (debug)
                console.log(per);
            return per?.result?.permissions;
        }
        catch (err) {
            if (debug)
                console.warn(err);

        }
        return null;
    }

    allowsReadingFile(per?: Permission | null): boolean {
        if (!per) return false;
        if (!per.role) {
            console.error("Can not determine reading access because is missing role on permission info", per);
            return false;
        }
        return per.role === "reader" || per.role === "writer" || per.role === "owner";
    }

    async shareFile(fileId: string, userEmail: string, notify: boolean = false, expirationTime?: Date) {
        try {
            // https://developers.google.com/drive/api/v3/reference/permissions/create
            const args = {
                fileId: fileId,
                emailAddress: userEmail,
                sendNotificationEmail: notify,
                type: "user",
                role: "reader"
            };
            const res = await this.api?.gapi.client.drive.permissions.create(args);
            if (expirationTime && res.result) {
                // this is only available to paid gsuite accounts
                // // set expiration time
                // console.log(expirationTime);
                this.api?.gapi.client.drive.permissions.update({
                    fileId: args.fileId,
                    role: args.role,
                    permissionId: res.result.id,
                    expirationTime: expirationTime
                }).then(_ => {
                    console.log("Access expires at " + expirationTime.toLocaleString());
                }).catch(_ => {
                    console.warn("Failed setting automatic expiration date - this feature is only available to paid gsuite accounts");
                    setTimeout(() => {
                        try {
                            console.log("Attempt to revoke permission to " + fileId);
                            this.api?.gapi.client.drive.permissions.delete({
                                fileId: fileId,
                                permissionId: res.result.id
                            }).then(() => {
                                console.log("Revoked permission to " + fileId);
                            });
                        }
                        catch (err) {
                            console.error(err);
                        }
                    }, 1000 * 3);
                });
            }
            if (debug)
                console.log(res);
            return res;
        }
        catch (err) {
            if (debug)
                console.warn(err);
        }
    }

    async revokePersmission(fileId: string, permission: Permission) {
        try {
            if (permission.kind === "owner") {
                console.error("Cannot revoke owner permission");
                return;
            }
            // https://developers.google.com/drive/api/v3/reference/permissions/delete
            const res = await this.api?.gapi.client.drive.permissions.delete({
                fileId: fileId,
                permissionId: permission.id
            });
            if (debug)
                console.log(res);
            return res;
        }
        catch (err) {
            if (debug)
                console.warn(err);
        }

    }

    async downloadFile(fileId: string, cancel?: FileCancellation): Promise<LoadedGLTF | null> {
        const file = await this.findFile(fileId, "id,name,size");
        if (!file) {
            console.error("Failed finding file?", fileId, file);
            return null;
        }
        this.client.models.showFilePreview(file.name);
        // console.trace("START DOWNLOAD", fileId, file.name);
        const downloadedBlob = await this.downloadFileBlob(file, this.reportFileDownloadProgress.bind(this), cancel);
        if (downloadedBlob) {
            const buf = await downloadedBlob.arrayBuffer();
            // using the file id as a seed - but what if we select the same file twice?
            const idProvider = new InstantiateIdProvider(this.hashString(fileId));
            const loaded = await parseSync(this.context, buf, null!, idProvider);
            if (loaded) {
                const pick = new LoadedGLTF(fileId, file.name, loaded, idProvider);
                return pick;
            }
        }
        return null;
    }

    private hashString(id: string): number {
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
    }

    private async downloadFileBlob(file, onProgress?: ProgressCallback, cancel?: FileCancellation): Promise<Blob | null> {
        if (!file) return null;
        const fileId = file.id;
        let fileSize = file.sizeBytes;
        if (fileSize === undefined && file.size !== undefined) {
            if (typeof file.size === "string")
                fileSize = parseInt(file.size);
            else
                fileSize = file.size;
        }
        const progressArgs: ProgressCallbackArgs = { file, loaded: 0, total: fileSize, progress: 0 };
        return new Promise((res, reject) => {
            const xhr = new XMLHttpRequest()
            xhr.open('GET', `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, true);
            xhr.setRequestHeader('Authorization', `Bearer ${this.client.api?.getAccessToken()}`)
            xhr.responseType = 'blob'
            xhr.onloadstart = _event => { }
            xhr.onprogress = event => {
                const { loaded } = event;
                if (cancel?.cancellationRequested) {
                    xhr.abort();
                    res(null);
                    return;
                }
                if (onProgress) {
                    progressArgs.loaded = loaded;
                    progressArgs.progress = loaded / fileSize;
                    onProgress(progressArgs);
                }
            }
            xhr.onabort = event => {
                if (cancel?.cancellationRequested) {
                    console.log("Download cancelled");
                    return;
                }
                console.warn(`xhr ${fileId}: download aborted at ${event.loaded} of ${event.total}`)
            }
            xhr.onerror = event => {
                console.error(`xhr ${fileId}: download error at ${event.loaded} of ${event.total}`)
                reject(new Error('Error downloading file'))
            }
            xhr.onload = _ => {
                res(xhr.response)
            }
            xhr.send()
        });
    }

    private reportFileDownloadProgress(cb: ProgressCallbackArgs) {
        if (debug)
            console.log((Math.floor(cb.progress * 10) * 10).toFixed(0) + " %");
        this.client.models.updateFilePreview(cb.progress);
    }
}