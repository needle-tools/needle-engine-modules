import { Context } from "@needle-tools/engine/engine/engine_setup";
import { DriveSyncedUserModel } from "../networking/DriveSyncedUser";


const baseTemplate = document.createElement('template');
baseTemplate.innerHTML = `
<style>
:host { 
    position:relative;
    display: flex;
    padding: 5px;
    justify-content: center;
    align-items: center;
    // border: 1px solid red;
}
.clickable:hover {
    cursor:pointer;
}
button {
    background: #1E88E5;
    color: white;
    border: none;
    padding: 5px 9px 7px 4px;
    border-radius: 4px;
    border: 1px solid rgba(255,255,255,.2);
    margin-right: 5px;
}
button:hover {
    background: #1976D2;
    cursor: pointer;
}

button#reconnect {
    background: #dddddd;
    color: black;
}

#users {
    display: flex;
    padding: 0 10px;
}
.user {
    margin-right: 5px;
    // border: 1px solid green;
}
.user img {
    height: 40px;
    border-radius: 50%;
}
img.no-access {
    filter: grayscale(100%);
    opacity: .7;
}
.user .icons {
    position: absolute;
    width: 35px;
    margin-top: -20px;
    display: flex;
    justify-content: right;
    align-items: end;
    // border: 1px solid red;
}
.user .require-access,
.user .await-access {
    z-index:10;
    background: none;
    border: none;
}


.rotate {
    transform-origin: .5em .75em; 
    animation: rotation 2s infinite linear;
}
@keyframes rotation {
    from {
        transform: rotate(0deg);
    }
    33% {
        transform: rotate(180deg);
    }
    to {
        transform: rotate(181deg);
    }
}


.jitter {
    transform-origin: .5em .75em; 
    animation: jitter 2s infinite linear;
}
@keyframes jitter {
    5%, 40% {
        transform: translate3d(-1px, 0, 0);
    }

    10%, 30% {
        transform: translate3d(1px, 0, 0);
    }

    15%, 25% {
        transform: translate3d(-2px, 0, 0);
    }

    20% {
        transform: translate3d(2px, 0, 0);
    }
}
</style>`;

baseTemplate.innerHTML += `
<button id="sign-in">🔑 Sign in</button>
<button id="select-file">📂 Select file</button>
<div id="users">
</div>
<div id="connection-state">
<button id="reconnect" title="You are currently disconnected. Click this button to try to rejoin the networked room">
📡 Reconnect
</button>
</div>
`

const userTempalte = document.createElement('template');
userTempalte.innerHTML = `
<div title="<username>" class="user">
    <img class="profile-pic" src="" />
    <div class="icons">
        <div title="grant access tooltip" class="jitter clickable require-access">🔓</div>
        <div title="Waiting for file access" class="rotate await-access">⏳</div>
    </div>
</div>
`


const COMPONENT_NAME = "needle-drive";

export class DriveUIComponent extends HTMLElement {

    static getOrCreate(context: Context): DriveUIComponent {
        const elements = document.getElementsByTagName(COMPONENT_NAME);
        let element = elements.length > 0 ? elements[0] : null;
        if (!element) {
            element = document.createElement(COMPONENT_NAME);
            context.domElement.appendChild(element);
        }
        return element as DriveUIComponent;
    }

    private _signinButton?: HTMLElement;
    private _selectFileButton?: HTMLElement;

    connectedCallback() {
        this.attachShadow({ mode: 'open' });

        if (this.shadowRoot) {
            this.shadowRoot.appendChild(baseTemplate.content.cloneNode(true));
            this._signinButton = this.shadowRoot.getElementById("sign-in") as HTMLElement;
            if (this._signinButton) {
                this._signinButton.style.display = "none";
            }

            this._selectFileButton = this.shadowRoot.getElementById("select-file") as HTMLElement;
            if (this._selectFileButton) {
                this._selectFileButton.style.display = "none";
            }

            this.updateConnectionState(true);

            // this.createUserIcon("Marcel", "marcel@needle.tools", "https://avatars.githubusercontent.com/u/5083203?s=40&v=4");
            // this.createUserIcon("Marcel", "marcel@needle.tools", "https://avatars.githubusercontent.com/u/2693840?s=64&v=4");
        }
    }

    createSignInButton(callback) {
        if (!this._signinButton) return;
        this._signinButton.style.display = "inline-block";
        this._signinButton.addEventListener("click", callback);
    }

    onSignedIn() {
        if (!this._signinButton) return;
        this._signinButton.style.display = "none";
    }

    createFilePicker(callback) {
        if (!this._selectFileButton) return;
        this._selectFileButton.style.display = "inline-block";
        this._selectFileButton.addEventListener("click", callback);
    }

    private userIcons: { [userId: string]: HTMLElement } = {};

    createUserIcon(name: string, userEmail: string, userPicture: string) {

        // if it already exists show it
        const existing = this.userIcons[userEmail];
        if (existing) {
            if (!existing.parentElement && this.shadowRoot)
                this.shadowRoot.appendChild(existing);
            return;
        }

        if (this.shadowRoot) {
            const imgTemplate = userTempalte.content.querySelector(".profile-pic") as HTMLImageElement;
            imgTemplate.src = userPicture;

            const users = this.shadowRoot.getElementById("users");
            users?.appendChild(userTempalte.content.cloneNode(true));

            const user = users?.children[users.children.length - 1] as HTMLElement;
            this.userIcons[userEmail] = user;
            user.title = name;
            const lock = user?.querySelector(".require-access") as HTMLElement;
            if (lock) {
                lock.style.display = "none";
            }

            const awaitAccess = user?.querySelector(".await-access") as HTMLElement;
            if (awaitAccess) {
                awaitAccess.style.display = "none";
            }
        }
    }

    removeUserIcon(model: DriveSyncedUserModel) {
        const user = this.userIcons[model.email];
        if (user) {
            user.remove();
            delete this.userIcons[model.email];
        }
    }

    updateConnectionState(connected: boolean) {
        const reconnectButton = this.shadowRoot?.getElementById("reconnect");
        switch (connected) {
            case true:
                if (reconnectButton)
                    reconnectButton.style.display = "none";
                break;
            case false:
                if (reconnectButton)
                    reconnectButton.style.display = "inline-block";
                break;
        }
    }

    addDisconnectButtonClickEvent(callback) {
        const disconnectedButton = this.shadowRoot?.getElementById("reconnect");
        if (disconnectedButton) {
            disconnectedButton.addEventListener("click", callback);
        }
    }

    showRequireAccess(userId) {
        const user = this.userIcons[userId];
        if (user) {
            const awaitAccess = user.querySelector(".await-access") as HTMLElement;
            if (awaitAccess) {
                awaitAccess.style.display = "inline-block";
            }
        }
    }

    hideRequireAccess(userId) {
        const user = this.userIcons[userId];
        if (user) {
            const awaitAccess = user.querySelector(".await-access") as HTMLElement;
            if (awaitAccess) {
                awaitAccess.style.display = "none";
            }
        }
    }

    private _previousGrantAccessCallback?;
    showGrantAccessButton(userId, tooltip, callback) {
        const user = this.userIcons[userId];
        if (user) {
            const lock = user?.querySelector(".require-access") as HTMLElement;
            if (lock) {
                lock.title = tooltip;
                lock.style.display = "inline-block";
                lock.removeEventListener("click", this._previousGrantAccessCallback);
                this._previousGrantAccessCallback = callback;
                lock.addEventListener("click", callback);
            }
            this.setNoAccess(user, true);
        }
    }

    hideGrantAccessButton(userId) {
        const user = this.userIcons[userId];
        if (user) {
            const lock = user?.querySelector(".require-access") as HTMLElement;
            if (lock) {
                lock.style.display = "none";
            }
            this.setNoAccess(user, false);
        }
    }

    private setNoAccess(user: HTMLElement, state: boolean) {
        const img = user.querySelector(".profile-pic") as HTMLImageElement;
        if (img) {
            if (state)
                img.classList.add("no-access");
            else
                img.classList.remove("no-access");
        }
    }

}

window.customElements.define(COMPONENT_NAME, DriveUIComponent);
