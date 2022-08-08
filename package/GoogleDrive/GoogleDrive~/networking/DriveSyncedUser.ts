import { Behaviour } from "@needle-tools/engine/engine-components/Component";
import { IModel, RoomEvents } from "@needle-tools/engine/engine/engine_networking";
import { Context } from "@needle-tools/engine/engine/engine_setup";
import { delay } from "@needle-tools/engine/engine/engine_utils";
import { DriveClient } from "../DriveClient";
import { DriveNetworkingBase } from "./DriveNetworkingBase";

export enum DriveSyncedUserEvents {
    SignedIn = "drive-user-signed-in",
}


export class DriveSyncedUserModel implements IModel {

    static getGUID(userId: string): string {
        return "drive/user/" + userId;
    }

    guid: string;
    id: string;
    name: string;
    email: string;
    profilePicture: string;

    constructor(id: string, name: string, email: string, profilePicture: string) {
        this.guid = DriveSyncedUserModel.getGUID(id);
        this.id = id;
        this.name = name;
        this.email = email;
        this.profilePicture = profilePicture;
    }
}

export class DriveSyncedUser extends DriveNetworkingBase {

    tryGetUserModel(userId: string): DriveSyncedUserModel | null {
        const user = this.userModels[userId];
        return user;
    }

    tryGetEmailForUser(userId: string): string | null {
        const user = this.userModels[userId];
        if (!user) return null;
        return user.email;
    }


    constructor(client: DriveClient) {
        super(client);
    }


    enable() {
        this.handleCurrentUsers();
        this.beginListen(RoomEvents.UserJoinedRoom, model => {
            console.log("User joined", model);
            this.handleUser(model.userId);
        })
        this.beginListen(RoomEvents.UserLeftRoom, model => {
            this.deleteUser(model.userId);
        });
        this.beginListen(RoomEvents.JoinedRoom, _ => {
            this.handleCurrentUsers();
        })
        this.beginListen(DriveSyncedUserEvents.SignedIn, this.onReceivedUserSignedInEvent.bind(this));
    }

    onLogin() {
        this.sendUserLoggedIn();
    }

    onLogout() {

    }

    onDisconnect() {
        super.onDisconnect();
        for (const user in this.userModels)
            this.client.ui.removeUserIcon(this.userModels[user]);
    }

    private userModels: { [id: string]: DriveSyncedUserModel } = {};

    private async sendUserLoggedIn() {
        if (!this.context.connection.connectionId) return;
        const userInfo = await this.client.api!.getUserInfo();
        const name = userInfo.name ?? (userInfo.email.split("@")[0]);
        const model = new DriveSyncedUserModel(this.context.connection.connectionId, name, userInfo.email, userInfo.picture);
        this.userModels[model.id] = model;
        this.context.connection.send(DriveSyncedUserEvents.SignedIn, model);
        console.log(userInfo);
        this.client.ui.createUserIcon(name, userInfo.email, userInfo.picture);
        // this.ui?.createUserProfilePic(model);
    }


    private onReceivedUserSignedInEvent(user: DriveSyncedUserModel) {
        console.log("User signed in", user);
        if (!this.context.connection.userIsInRoom(user.id)) {
            this.deleteUser(user);
            return;
        }
        this.userModels[user.id] = user;
        this.client.ui.createUserIcon(user.name, user.email, user.profilePicture);
        // this.ui?.createUserProfilePic(user);
    }


    private handleCurrentUsers() {
        for (const user of this.context.connection.usersInRoom()) {
            this.handleUser(user);
        }
    }

    private handleUser(id: string) {
        const isLocalUser = id === this.context.connection.connectionId;
        if (!isLocalUser) {
            // for timing issues e.g. if the connection was made before the drive client was connected
            // so this way we get previously received user models
            const model = this.context.connection.tryGetState(DriveSyncedUserModel.getGUID(id)) as DriveSyncedUserModel;
            if (model) this.onReceivedUserSignedInEvent(model);
        }
    }

    private deleteUser(user: DriveSyncedUserModel | string, deleteRemote: boolean = true) {

        if (typeof user === "string") {
            user = this.userModels[user];
        }
        if (!user) return;

        delete this.userModels[user.id];

        this.client.ui.removeUserIcon(user);

        if (deleteRemote)
            this.context.connection.sendDeleteRemoteState(user.guid);// .send("delete-state", { guid: user.guid });
    }
}