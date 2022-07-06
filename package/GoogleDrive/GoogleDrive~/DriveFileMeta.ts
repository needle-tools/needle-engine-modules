import { BaseApiProvider } from "./BaseApiProvider";
import { DriveClient } from "./DriveClient";

declare type DriveFileMetaUpdateOptions = {
    autoStringify?: boolean
}

declare type DriveFileMetaDownloadOptions = {
    autoParse?: boolean
}

const debug = false;

export class DriveFileMeta extends BaseApiProvider {

    static AddThumbnailObjectFromBuffer(meta: object, arrayBuffer: ArrayBuffer, mimeType = "image/png") {
        const base64String = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        return this.AddThumbnailObjectFromBase64(meta, base64String, mimeType);
    }
    static AddThumbnailObjectFromBase64(meta: object, base64str: string, mimeType = "image/png") {
        // console.log(base64str);
        if (base64str.startsWith("data:")) {
            const parts = base64str.split("base64,");
            base64str = parts[1];
        }
        // console.log(base64str);
        const encodedThumbnail = DriveFileMeta.base64ToUrlSafeBase64(base64str);
        const hint = meta["contentHints"] ?? {};
        meta["contentHints"] = hint;
        hint["thumbnail"] = {
            image: encodedThumbnail,
            mimeType: mimeType,
        }
        // console.log(meta);
        return meta;
    }

    static base64ToUrlSafeBase64(base64: string) {
        return base64.replace(/\+/g, "-").replace(/\//g, "_");
    }

    static addProperties(meta: object, properties: object): object {
        if (!meta["properties"]) meta["properties"] = {};
        Object.assign(meta["properties"], properties);
        return meta;
    }

    static addAppProperties(meta: object, properties: object): object {
        if (!meta["appProperties"]) meta["appProperties"] = {};
        Object.assign(meta["appProperties"], properties);
        return meta;
    }

    constructor(client : DriveClient) {
        super(client);
    }

    async updateMeta(fileId: string, meta: object, opts: DriveFileMetaUpdateOptions | null | undefined = { autoStringify: true }) {
        if (!fileId || typeof fileId !== "string") {
            console.warn("Can not update meta: invalid id", fileId)
            return false;
        }

        this.validateMeta(meta, "properties", opts?.autoStringify);
        this.validateMeta(meta, "appProperties", opts?.autoStringify);

        if (debug)
            console.log("Updating meta", meta);

        const res = await this.api?.gapi.client.drive.files.update({
            ...meta,
            fileId: fileId
        });
        if (debug)
            console.log(res);
        return res;
    }

    async getMeta(fileId: string, opts: DriveFileMetaDownloadOptions | null | undefined = { autoParse: true }) {
        return new Promise((res, _) => {
            const request = this.api?.gapi.client.drive.files.get({
                fileId: fileId,
                fields: "properties,appProperties"
            });
            request.execute(r => {
                const obj = r?.result ?? r;

                if (obj) {

                    if (opts?.autoParse) {
                        this.autoObjectify(obj.properties);
                        this.autoObjectify(obj.appProperties);
                    }
                }

                res(obj);
            });
        })
    }

    private validateMeta(meta, fieldName: string, allowStringify: boolean = false) {
        if (meta) {
            const data = meta[fieldName];
            if (data) {
                for (const propKey in data) {
                    const prop = data[propKey];
                    if (typeof prop === "object") {
                        if (allowStringify) {
                            data[propKey] = JSON.stringify(prop);
                        }
                        else
                            console.warn("Meta property contains invalid value object value. Please stringify before updating: \"" + propKey + "\"", prop);
                    }
                }
            }
        }
    }

    private autoObjectify(obj: object) {
        if (!obj) return;
        for (const propKey in obj) {
            const prop = obj[propKey];
            if (typeof prop === "string") {
                try {
                    const isJsonObject = prop.startsWith("{") && prop.endsWith("}");
                    const isJsonArray = prop.startsWith("[") && prop.endsWith("]");
                    if (isJsonObject || isJsonArray) {
                        obj[propKey] = JSON.parse(prop);
                    }
                } catch (e) {
                    console.error(e);
                }
            }
        }
    }
}