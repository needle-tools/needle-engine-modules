import { Context } from "needle.tiny.engine/engine/engine_setup";
import { DriveApi } from "./DriveApi";
import { DriveClient } from "./DriveClient";

export abstract class BaseApiProvider {

    get context() {
        return this._client.context;
    }

    get api() {
        return this._client.api;
    }

    get gapi(){
        return this._client.api?.gapi;
    }

    get client(){
        return this._client;
    }

    private _client : DriveClient;

    constructor(client : DriveClient) {
        this._client = client;
    }
} 