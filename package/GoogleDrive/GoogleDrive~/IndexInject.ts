
// this automatically checks that the required google api scripts are present in the document
// otherwise it will add them
// once loaded the init callback is invoked

import { getParam } from "@needle-tools/engine/engine/engine_utils";

const debug = getParam("debug")

const requiredScriptTags = [
    "https://apis.google.com/js/api.js",
    "https://accounts.google.com/gsi/client",
]

export const appendScript = function (initCallback: Function) {

    ensureScriptTags(requiredScriptTags);

    if (testValidGoogleApi()) {
        initCallback();
        return;
    }

    const interval = setInterval(() => {
        if (window["google"] && window["gapi"]) {
            clearInterval(interval);
            initCallback(window["gapi"], window["google"]);
        }
    }, 100);
}

function testValidGoogleApi() {
    if (window["google"] && window["gapi"]) {
        return true;
    }
    return false;
}

function ensureScriptTags(scriptTags: string[]) {
    const allTags = document.getElementsByTagName("script");
    for (let j = 0; j < scriptTags.length; j++) {
        const tag = scriptTags[j];
        let found = false;
        for (let i = 0; i < allTags.length; i++) {
            const script = allTags[i];
            if (script.src === tag) {
                found = true
                break;
            }
        }
        if (!found) {
            if (debug)
                console.log("adding script tag: " + tag);
            const script = document.createElement("script");
            script.src = tag;
            document.head.appendChild(script);
        }
    }
}


// <script async defer src="https://apis.google.com/js/api.js" onload="gapiLoaded()"></script>
// <script async defer src="https://accounts.google.com/gsi/client" onload="gapiLoaded()"></script>