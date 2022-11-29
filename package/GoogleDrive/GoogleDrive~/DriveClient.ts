import { Behaviour } from "@needle-tools/engine";
import { KeyCode } from "@needle-tools/engine/engine/engine_input";

import { DriveApi } from "./DriveApi";
import { DriveFileAccess } from "./DriveFileAccess";
import { DriveFilePicker } from "./DriveFilePicker";
import { appendScript } from "./IndexInject";
import { DriveNetworking } from "./networking/DriveNetworking";
import { DriveModelFileManager } from "./DriveModelFileManager";
import { DriveUIComponent } from "./ui/DriveUIComponent"
import { FileCancellation } from "./FileCancellation";
import { DriveShareDialogue } from "./DriveShareDialogue";


const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.install';

export class DriveClient extends Behaviour {

    clientId?: string;
    apiKey?: string;
    createLoginButton: boolean = true;
    useFilePicker: boolean = false;

    get ui(): DriveUIComponent {
        return this._ui!;
    }

    get api(): DriveApi | undefined {
        return this._api;
    }

    get access(): DriveFileAccess | undefined {
        return this.files;
    }

    get networking(): DriveNetworking {
        return this._networking!;
    }

    get models(): DriveModelFileManager {
        return this.modelManager!;
    }

    get share(): DriveShareDialogue | undefined {
        return this.shareClient;
    }

    onEnable(): void {
        appendScript(this.init.bind(this));
    }

    private init(gapi, google) {
        if (!gapi || !google) {
            console.error("invalid init call, missing gapi or google", gapi, google);
            return;
        }
        gapi.load('client', async () => {

            this._ui = DriveUIComponent.getOrCreate(this.context);

            await gapi.client.init({
                apiKey: this.apiKey,
                discoveryDocs: [DISCOVERY_DOC],
            });

            const tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: this.clientId,
                scope: SCOPES,
                callback: '', // defined later
            });

            this._api = new DriveApi(this.apiKey, google, gapi, tokenClient);

            this._networking = new DriveNetworking(this);
            this._networking.enable();

            if (this.useFilePicker)
                this.picker = new DriveFilePicker(this, this._api, this.context);

            if (this.createLoginButton && !this._api.isSignedIn()) {
                this._ui.createSignInButton(() => this.handleAuthClick());
                // this.ui.createSigninButton(this.context, () => this.handleAuthClick());
            }

            this.files = new DriveFileAccess(this);
            this.modelManager = new DriveModelFileManager(this);
            this.shareClient = new DriveShareDialogue(this);
        });
    }

    private _ui?: DriveUIComponent;
    private _api?: DriveApi;
    // private ui: DriveUI = new DriveUI();
    private picker?: DriveFilePicker;
    private _networking?: DriveNetworking;
    private files?: DriveFileAccess;
    private modelManager?: DriveModelFileManager;
    private shareClient?: DriveShareDialogue;


    private get gapi() {
        return this._api?.gapi;
    }
    private get google() {
        return this._api?.google;
    }
    private get tokenClient() {
        return this._api?.tokenClient;
    }


    private handleAuthClick() {
        if (!this._api) return;
        this.tokenClient.callback = async (resp) => {

            if (resp.error !== undefined) {
                throw (resp);
            }

            this.ui.onSignedIn();
            this.ui.addDisconnectButtonClickEvent(() => {
                this.networking.ensureConnectedToRoom();
            });
            // this.ui.removeSigninButton();

            this.networking?.onLogin()


            if (this.picker) {

                this.ui.createFilePicker(async () => {
                    this.currentCancellationToken?.cancel();
                    this.currentCancellationToken = new FileCancellation();
                    const file = await this.picker?.openFilePicker(this.currentCancellationToken);
                    console.log("PICKED", file);
                    this.modelManager?.onCreateFile(file);
                    this.dispatchEvent(new CustomEvent("file-picked", { detail: file?.root }));
                });
            }


            // this.files?.findFile("1mc1atrHjBWuuJ62lQQMFzjl6GbvaW7L_");
            // this.files?.getPermission("1mc1atrHjBWuuJ62lQQMFzjl6GbvaW7L_");
            // this.files?.shareFile("1bEosVOqf8HhmfLfCNIqmkMNFnZ6siXiu", "felix@needle.tools");
            // const permissions = await this.files?.getPermission("1bEosVOqf8HhmfLfCNIqmkMNFnZ6siXiu");
            // console.log(permissions);
            // if (permissions)
            //     for (const per of permissions) {
            //         if(per.emailAddress === "felix@needle.tools")
            //             await this.files?.revokePersmission("1bEosVOqf8HhmfLfCNIqmkMNFnZ6siXiu", per);
            //     }
        };

        if (!this._api.isSignedIn) {
            // Prompt the user to select a Google Account and ask for consent to share their data
            // when establishing a new session.
            this.tokenClient.requestAccessToken({ prompt: 'consent' });
        }
        else {
            // Skip display of account chooser and consent dialog for an existing session.
            this.tokenClient.requestAccessToken({ prompt: '' });
        }
    }

    private currentCancellationToken?: FileCancellation;

    update() {
        if (this.context.input.isKeyDown(KeyCode.ESCAPE)) {
            this.currentCancellationToken?.cancel();
            this.currentCancellationToken = undefined;
        }
    }


}