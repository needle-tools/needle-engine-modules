import { MathUtils } from "three";

// maybe replace with https://developer.mozilla.org/en-US/docs/Web/API/AbortController ?
export class FileCancellation {
    id: string;
    cancellationRequested: boolean = false;

    constructor() {
        this.id = MathUtils.generateUUID();
    }

    cancel() {
        this.cancellationRequested = true;
    }
}