import { PlayableDirector } from "needle.tiny.engine/engine-components/timeline/PlayableDirector";
import { TrackModel } from "needle.tiny.engine/engine-components/timeline/TimelineModels";
import { TrackHandler } from "needle.tiny.engine/engine-components/timeline/TimelineTracks";
import { VideoPlayer } from "needle.tiny.engine/engine-components/VideoPlayer"

// Import this package in your main.ts file

PlayableDirector.registerCreateTrack("VideoTrack", (_dir, _track: TrackModel) => {
    return new VideoTrack();

});

class VideoTrack extends TrackHandler {

    get output(): VideoPlayer {
        return this.track.outputs[0] as VideoPlayer;
    }

    _lastTimeSet: number = 0;

    evaluate(time: number) {
        if (!this.output) return;
        this.output.isLooping = false;
        this.output.playbackSpeed = 0;

        const isPlaying = this.director.isPlaying;

        if (!isPlaying) {
            this.output.pause();
        }

        for (const clip of this.track.clips) {
            if (clip.start <= time && clip.end > time) {
                if (isPlaying)
                    this.output.playbackSpeed = clip.timeScale;

                const clipModel = clip.asset as VideoClipModel;
                if (clipModel.clip) {
                    this.output.setClipURL(clipModel.clip);
                    if (!this.output.isPlaying) this.output.play();
                }


                if (this.director.context.time.time - this._lastTimeSet > .3) {
                    const t = this.getClipTime(time, clip);
                    const diff = Math.abs(t - this.output.currentTime);
                    if (diff > .1 && this.output.isPlaying) {
                        this._lastTimeSet = this.director.context.time.time;
                        // console.log("SET TIME", t);
                        this.output.currentTime = t;
                    }
                }
                return;
            }
        }

    }
}

class VideoClipModel {
    clip?: string;
}