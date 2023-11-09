import { GameObject } from "@needle-tools/engine";
import { IModel, RoomEvents, UserJoinedOrLeftRoomModel } from "@needle-tools/engine";
import { InstantiateIdProvider } from "@needle-tools/engine";
import { UserInfo } from "../DriveApi";
import { DriveClient } from "../DriveClient";
import { LoadedGLTF } from "../DriveFileAccess";
import { DriveNetworkingBase } from "./DriveNetworkingBase";

export enum DriveSyncedFileEvents {
    OpenedFile = "drive-user-opened-file",
    RequiresAccess = "drive-user-requires-access",
    GainedAccess = "drive-user-gained-access",
}

export class UserOpenedFileModel implements IModel {
    static getGUID(userId: string): string {
        return "drive/action/file-open/" + userId;
    }

    guid: string;
    fileId: string;
    fileName: string;
    userId: string;
    parentGuid: string;

    constructor(userId: string, fileId: string, fileName: string, parent: string) {
        this.guid = UserOpenedFileModel.getGUID(userId);
        this.fileId = fileId;
        this.fileName = fileName;
        this.userId = userId;
        this.parentGuid = parent;
    }
}

export class RequiresAccessModel {
    userId: string; // < who needs access id
    requireAccessEmail: string; // < who needs access
    requireAccessName: string;
    ownerId: string;
    fileId: string; // < which file
    fileModelGuid: string; // opened file model guid
    fileName: string;

    constructor(file: UserOpenedFileModel, userId: string, email: string, name: string, fileName: string) {
        this.userId = userId;
        this.fileId = file.fileId;
        this.fileModelGuid = file.guid;
        this.ownerId = file.userId;
        this.requireAccessEmail = email;
        this.requireAccessName = name;
        this.fileName = fileName;
    }
}

export class GainedAccessModel {
    userEmail: string;

    constructor(userEmail: string) {
        this.userEmail = userEmail;
    }
}

export class DriveSyncedFile extends DriveNetworkingBase {
    constructor(client: DriveClient) {
        super(client);
    }

    enable(): void {
        this.beginListen(DriveSyncedFileEvents.OpenedFile, this.onReceivedUserOpenedFile.bind(this));
        this.beginListen(DriveSyncedFileEvents.RequiresAccess, this.onReceivedRequiresAccess.bind(this));
        this.beginListen(DriveSyncedFileEvents.GainedAccess, this.onReceivedRemoteUserGainedAccess.bind(this));
    }


    private _cachedFileEvents: UserOpenedFileModel[] = [];
    private _requiresAccessUsers: string[] = [];

    onLogin() {
        // if calling received file caches new events
        for (const model of this._cachedFileEvents) {
            this.onReceivedUserOpenedFile(model);
        }
    }


    async onSendOpenedFile(fileId: string, fileName: string, parent: THREE.Object3D) {
        if (fileId) {
            if (this.context.connection.connectionId) {

                // if a new file is opened make sure to delete the previously opened file events
                // the server must only know about the last file that was opened
                for(const prev in this._cachedFileEvents){
                    this.context.connection.sendDeleteRemoteState(this._cachedFileEvents[prev].guid);
                }
                this._cachedFileEvents.length = 0;

                const parentGuid = !parent ? null : parent["guid"];
                // const info = await this.client.api?.getUserInfo();
                const model = new UserOpenedFileModel(this.context.connection.connectionId, fileId, fileName, parentGuid);
                this.context.connection.send(DriveSyncedFileEvents.OpenedFile, model);
            }
        }
    }


    private async onReceivedUserOpenedFile(model: UserOpenedFileModel) {
        const userIsInRoom = this.context.connection.userIsInRoom(model.userId);
        if (!userIsInRoom) {
            console.warn("Received user opened file but user is not in room anymore");
            this.context.connection.sendDeleteRemoteState(model.guid);
            return;
        }

        console.log("OPENED FILE", model);
        // we can delete the cache locally because we only care for the last file opened
        this._cachedFileEvents.length = 0;

        if (model.userId !== this.context.connection.connectionId) {

            if (!this.client.api?.isSignedIn()) {
                console.log("USER IS NOT SIGNED IN");
                this._cachedFileEvents.push(model);
                this.client.models.showFilePreview(model.fileName);
            }
            else {

                this.client.models.onClearPreviousFiles();
                this.client.models.showFilePreview(model.fileName);

                const file = await this.client.access?.findFile(model.fileId);
                const myInfo = await this.client.api.getUserInfo();

                if (file) {
                    console.log("FILE", file);
                    this.client.ui.hideRequireAccess(myInfo.email);
                    const res = await this.client.access?.downloadFile(model.fileId);
                    if (res) {
                        this.client.models.onCreateFileFromModel(model, res);
                    }
                    return;
                }
                else this.onNoPermission(model, myInfo);
            }
        }
    }

    private _pollAccessInterval: any;

    private onNoPermission(model: UserOpenedFileModel, userinfo: UserInfo) {
        if (this.context.connection.connectionId) {
            console.warn("NO PERMISSION", model);
            this._cachedFileEvents.push(model);
            const accessModel = new RequiresAccessModel(model, this.context.connection.connectionId, userinfo.email, userinfo.name ?? userinfo.email, model.fileName);
            this.context.connection.send(DriveSyncedFileEvents.RequiresAccess, accessModel);
            this.client.ui.showRequireAccess(userinfo.email);

            if (this._pollAccessInterval)
                clearInterval(this._pollAccessInterval);
            this._pollAccessInterval = setInterval(async () => {
                if (await this.client.access?.findFile(model.fileId)) {
                    this.client.ui.hideRequireAccess(userinfo.email);
                    clearInterval(this._pollAccessInterval);
                    this._pollAccessInterval = null;
                    this.onAccessGranted(model);
                    this.context.connection.send(DriveSyncedFileEvents.GainedAccess, new GainedAccessModel(userinfo.email));
                }
            }, 2000);
        }
    }

    private async onReceivedRequiresAccess(model: RequiresAccessModel) {
        if (model && model.ownerId === this.context.connection.connectionId) {
            console.warn("Other user does not have access", model);

            if (!this._requiresAccessUsers.includes(model.requireAccessEmail))
                this._requiresAccessUsers.push(model.requireAccessEmail);

            const tooltip = model.requireAccessEmail + " requires access to " + model.fileName + ": click to grant access";
            this.client.ui.showGrantAccessButton(model.requireAccessEmail, tooltip, async () => {
                this.client.share?.showDialogue(model.fileId);
                
                // copy all the users that require access to the clipboard
                const emails = this._requiresAccessUsers.join(" ");
                this._requiresAccessUsers.length = 0;
                navigator.clipboard.writeText(emails);
                // this.client.ui.hideGrantAccessButton(model.requireAccessEmail);
                // console.log("Granting access");
                // // Todo: this should be explicit via ui
                // const res = await this.client.access?.shareFile(model.fileId, model.requireAccessEmail, false, this.getExperiationTime(1));
                // if (res) {
                //     const grantedModel = new GrantedAccessModel(model.userId, model.fileModelGuid);
                //     this.context.connection.send(DriveSyncedFileEvents.GrantedAccess, grantedModel);
                // }
                // else {
                //     console.error("Failed sharing file with", model);
                //     this.client.ui.showGrantAccessButton(model.requireAccessEmail, "Could not share file with " + model.requireAccessEmail + ", please share manually via drive", () => {
                //         console.log("Can not grant access, please use drive ui and share the file with " + model.requireAccessEmail);
                //     });
                // }

            });
            // this._driveAccessUI.createGrantAccessButton(model, async () => {
            // });
        }
    }

    private async onReceivedRemoteUserGainedAccess(model: GainedAccessModel) {
        this.client.ui.hideGrantAccessButton(model.userEmail);
    }

    // private getExperiationTime(min: number) {
    //     const minutesToAdd = min;
    //     const currentDate = new Date();
    //     const futureDate = new Date(currentDate.getTime() + minutesToAdd * 60000);
    //     return futureDate;
    // }

    private async onAccessGranted(model: UserOpenedFileModel) {

        const i = this._cachedFileEvents.findIndex(x => x.guid === model.guid);
        if (i >= 0) this._cachedFileEvents.splice(i, 1);

        console.log("RECEIVED GRANTED PERMISSION", model)

        this.client.api?.getUserInfo().then(i => {
            this.client.ui.hideRequireAccess(i.email);
        })

        console.log("FILE", await this.client.access?.findFile(model.fileId));

        // const res = await this.client.access?.getPermission(model.fileId);
        // const myInfo = await this.client.api?.getUserInfo();
        // const hasPermission = this.client.access?.allowsReadingFile(res?.find(x => x.emailAddress === myInfo?.email));
        // console.log(hasPermission, res);

        const file = await this.client.access?.downloadFile(model.fileId);
        if (file) {
            this.client.models.onCreateFileFromModel(model, file);
            return;
        }
    }
}