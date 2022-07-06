
export declare type UserInfo = {
    email: string,
    email_verified: boolean,
    family_name?: string,
    given_name?: string,
    hd?: string;
    local?: string,
    name?: string,
    picture: string;
    sub?: string
};

export class DriveApi {
    apiKey: string;
    google: any;
    gapi: any;
    tokenClient: any;

    constructor(apiKey, google, gapi, tokenClient) {
        this.apiKey = apiKey;
        this.google = google;
        this.gapi = gapi;
        this.tokenClient = tokenClient;
    }


    getAccessToken() {
        return this.gapi?.client?.getToken()?.access_token;
    }

    isSignedIn() {
        const token = this.getAccessToken();
        return typeof token === "string";
    }

    private _userInfo?: UserInfo;

    async getUserInfo(): Promise<UserInfo> {
        if (this._userInfo) return this._userInfo;
        const res: UserInfo = await fetch("https://www.googleapis.com/oauth2/v3/userinfo?access_token=" + this.getAccessToken()).then(res => res.json());
        console.log(res);
        if(!res.name){
            res.name = res.email.split("@")[0];
        }
        return res;
    }
}