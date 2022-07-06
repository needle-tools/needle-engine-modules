import { BaseApiProvider } from "../BaseApiProvider";
import { DriveClient } from "../DriveClient";

export abstract class DriveNetworkingBase extends BaseApiProvider {
    constructor(client: DriveClient) {
        super(client);
    }

    enable() {

    }

    disable() {
        this.stopListenAll();
    }

    onDisconnect() { }

    subs: { key: string, cb: Function }[] = [];

    beginListen(evt: string, cb: Function) {
        const r = this.context.connection.beginListen(evt, cb);
        this.subs.push({ key: evt, cb: r });
    }

    stopListenAll(clear: boolean = true) {
        for (const sub of this.subs) {
            this.context.connection.stopListening(sub.key, sub.cb);
        }
        if (clear)
            this.subs.length = 0;
    }

}