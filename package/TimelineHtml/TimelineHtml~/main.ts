import { PlayableDirector } from "needle.tiny.engine/engine-components/timeline/PlayableDirector";
import { ClipModel, TrackModel } from "needle.tiny.engine/engine-components/timeline/TimelineModels";
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

class CssModelView {
    clip: ClipModel;
    model: CssModel;

    private _elements: NodeListOf<Element>;
    private _didHaveClass: boolean[] = [];

    constructor(clip: ClipModel) {
        this.clip = clip;
        this.model = clip.asset;
        this._elements = document.querySelectorAll(this.model.query);
        this._elements.forEach(e => {
            this._didHaveClass.push(e.classList.contains(this.model.class));
        });
    }

    onEnable(){
        this._elements.forEach(el => {
            el.classList.remove(this.model.class);
        });
    }

    evaluate(time: number) {
        const active = this.clip.start <= time && this.clip.end >= time;
        this._elements.forEach(el => {
            if (!active) {
                el.classList.remove(this.model.class);
            }
            else {
                el.classList.add(this.model.class);
            }
        });
    }

    reset() {
        this._elements.forEach((el, i) => {
            if (this._didHaveClass[i]) {
                el.classList.add(this.model.class);
            }
            else {
                el.classList.remove(this.model.class);
            }
        }
        );
    }
}

class CssTrack extends TrackHandler {

    private _modelViews: CssModelView[] = [];

    onEnable() {
        if (this._modelViews.length != this.track.clips.length)
            this._modelViews.length = 0;
        for (const clip of this.track.clips) {
            this._modelViews.push(new CssModelView(clip));
        }
        this._modelViews.forEach(mv => mv.onEnable());
    }

    onDisable() {
        this._modelViews.forEach(mv => mv.reset());
    }

    evaluate(time: number) {
        for (const mv of this._modelViews) {
            mv.evaluate(time);
        }
    }

}
