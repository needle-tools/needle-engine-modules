import { DriveClient } from "./DriveClient";

export class DriveShareDialogue {
    private client: DriveClient;
    private shareClient;

    constructor(client: DriveClient) {
        this.client = client;
    }

    async showDialogue(fileId: string) {
        if(!fileId || fileId.length < 1) return;
        if(!this.shareClient){
            await new Promise<void>((res, _) => {
                this.client.api?.gapi.load('drive-share', () => {
                    const s = this.shareClient = new this.client.api!.gapi.drive.share.ShareClient();
                    s.setOAuthToken(this.client.api?.getAccessToken());
                    res();
                });
            });
        }
        this.shareClient.setItemIds([fileId]);
        this.shareClient.showSettingsDialog();
    }
}