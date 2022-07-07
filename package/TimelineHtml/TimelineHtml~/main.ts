import { PlayableDirector } from "needle.tiny.engine/engine-components/timeline/PlayableDirector";
import { TrackModel } from "needle.tiny.engine/engine-components/timeline/TimelineModels";
import { TrackHandler } from "needle.tiny.engine/engine-components/timeline/TimelineTracks";

PlayableDirector.registerCreateTrack("CssTrack", (_dir, _track: TrackModel) => {
    return new CssTrack();

});

class CssTrack extends TrackHandler {

    onEnable(){
        console.log(this.track);
    }
    
    evaluate(time: number) {
    }
}