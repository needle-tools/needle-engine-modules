import { PlayableDirector } from "needle.tiny.engine/engine-components/timeline/PlayableDirector";
import { TrackModel } from "needle.tiny.engine/engine-components/timeline/TimelineModels";
import { TrackHandler } from "needle.tiny.engine/engine-components/timeline/TimelineTracks";
import { getParam } from "needle.tiny.engine/engine/engine_utils";

const debug = getParam("debugcsstrack")

PlayableDirector.registerCreateTrack("CssTrack", (_dir, _track: TrackModel) => {
    return new CssTrack();
});


declare type CssModel = {
    query: string;
    class: string;
}

class CssTrack extends TrackHandler {

    onEnable() {
        if (this._lastActive) this.onUnapply(this._lastActive.asset);
        this._lastActive = undefined;
    }

    onDisable(){
        if (this._lastActive) this.onUnapply(this._lastActive.asset);
        this._lastActive = undefined;
    }

    private _lastActive?: any;

    evaluate(time: number) {
        for (const clip of this.track.clips) {
            if (clip.start <= time && clip.end >= time) {
                if (clip !== this._lastActive) {

                    if (this._lastActive)
                        this.onUnapply(this._lastActive.asset);
                    this._lastActive = clip;
                    this.onApply(clip.asset);
                }
            }
            else if (clip === this._lastActive) {
                this._lastActive = undefined;
                this.onUnapply(clip.asset);
            }
        }
    }

    onApply(model: CssModel) {
        if (!model) return;
        if (!model.class) return;
        const elements = document.querySelectorAll(model.query);
        if (elements) {
            if (debug)
                console.log("ADD CLASS", model.class, elements);
            for(let i = 0; i < elements.length; i++)
                elements[i].classList.add(model.class);
        }
        else if (debug) console.warn("could not find " + model.query, model.class)
    }

    onUnapply(model: CssModel) {
        if (!model) return;
        if (!model.class) return;
        const elements = document.querySelectorAll(model.query);
        if (elements?.length) {
            if (debug)
                console.log("REMOVE CLASS", model.class, elements);
            for(let i = 0; i < elements.length; i++)
                elements[i].classList.remove(model.class);
        }
        else if (debug) console.warn("could not find " + model.query, model.class)
    }
}
