import { GameObject } from "needle.tiny.engine/engine-components/Component";
import { SyncedRoom } from "needle.tiny.engine/engine-components/SyncedRoom";
import { ApplicationEvents } from "needle.tiny.engine/engine/engine_application";
import { RoomEvents } from "needle.tiny.engine/engine/engine_networking";
import { BaseApiProvider } from "../BaseApiProvider";
import { DriveClient } from "../DriveClient";
import { DriveNetworkingBase } from "./DriveNetworkingBase";
import { DriveSyncedFile } from "./DriveSyncedFile";
import { DriveSyncedUser } from "./DriveSyncedUser";


export class DriveNetworking extends DriveNetworkingBase {

    get user() {
        return this._user;
    }

    get file() {
        return this._file;
    }

    constructor(client: DriveClient) {
        super(client);
        this._user = new DriveSyncedUser(client);
        this._file = new DriveSyncedFile(client);
        client.context.application.addEventListener(ApplicationEvents.Visible, () => {
            this.ensureConnectedToRoom();
        });
    }

    enable() {
        super.enable();
        this._user.enable();
        this._file.enable();

        this.beginListen(RoomEvents.JoinedRoom, _ => {
            this.onConnect();
        });
        this.beginListen(RoomEvents.LeftRoom, _ => {
            this.onDisconnect();
        });
    }

    disable() {
        super.disable();
        this._user.disable();
        this._file.disable();
    }

    onLogin() {
        this._user.onLogin();
        this._file.onLogin();
    }

    onLogout() {
        this._user.onLogout();
        // this._file.onLogout();
    }

    onConnect() {
        this.client.ui.updateConnectionState(true);
        if (this.client.api?.isSignedIn())
            this.onLogin();
    }

    onDisconnect(): void {
        this.user.onDisconnect();
        this.client.ui.updateConnectionState(false);
    }

    ensureConnectedToRoom() {
        if (!this.context.connection.isConnected) {
            console.log("Attempt connecting to networking backend");
            this.context.connection.connect();
        }
        if (!this.context.connection.isInRoom) {
            const syncedRoom = GameObject.findObjectOfType(SyncedRoom, this.context);
            if (syncedRoom) {
                console.log("Attempt connecting to room");
                this.context.connection.joinRoom(syncedRoom.roomName, false);
            }
            else console.warn("Can not connect to room, no synced room component found");
        }
    }

    private _user: DriveSyncedUser;
    private _file: DriveSyncedFile;

}