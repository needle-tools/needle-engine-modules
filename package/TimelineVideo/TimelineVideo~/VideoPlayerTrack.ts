import { PlayableDirector, VideoPlayer, serializable } from "@needle-tools/engine";
import { TrackModel } from "@needle-tools/engine";
import { TrackHandler } from "@needle-tools/engine";
import { getParam, resolveUrl } from "@needle-tools/engine";

const debug = getParam("debugvideotrack");

// Import this package in your main.ts file

PlayableDirector.registerCreateTrack("VideoTrack", (_dir, _track: TrackModel) => {
    return new VideoTrack();

});

class VideoTrack extends TrackHandler {

    get output(): VideoPlayer {
        return this.track.outputs[0] as VideoPlayer;
    }

    _lastTimeSet: number = 0;

    private _resolvedClipUrls: boolean = false;

    onEnable() {
        if (!this._resolvedClipUrls) {
            this._resolvedClipUrls = true;
            for (const clip of this.track.clips) {
                const model = clip.asset as VideoClipModel;
                if (model.clip) {
                    model.clip = resolveUrl(this.director.sourceId, model.clip);
                }
            }
        }
    }

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
                    if (diff > .3 && this.output.isPlaying) {
                        if (debug)
                            console.log("Sync video time", diff, t);
                        this._lastTimeSet = this.director.context.time.time;
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
