import { PlayableDirector } from "@needle-tools/engine";
import { ClipModel, TrackModel } from "@needle-tools/engine/src/engine-components/timeline/TimelineModels";
import { TrackHandler } from "@needle-tools/engine/src/engine-components/timeline/TimelineTracks";
import { getParam } from "@needle-tools/engine/src/engine/engine_utils";

const debug = getParam("debugcsstrack")

PlayableDirector.registerCreateTrack("CssTrack", (_dir, _track: TrackModel) => {
    return new CssTrack();
});


declare type CssModel = {
    id: string;
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

    onEnable() {
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
    private _viewsMaps: Map<string, CssModelView> = new Map();

    get isCssTrack() { return true; }

    constructor() {
        super();
    }

    onEnable() {
        if (this._modelViews.length != this.track.clips.length) {
            this._modelViews.length = 0;
            this._viewsMaps.clear();
        }
        let index = 0;
        for (const clip of this.track.clips) {
            if(!clip.asset.id){
                clip.asset.id = "clip-" + index++;
            }
            const view = new CssModelView(clip);
            this._modelViews.push(view);
            if (clip?.asset?.id?.length)
                this._viewsMaps.set(clip.asset.id, view);
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

    /* must stay in sync with website.ScrollNavigation */
    getScrollTimeForId(id: string) {
        const mv = this._viewsMaps.get(id);
        if (mv) {
            return mv.clip.start;
        }
        return -1;
    }
}
