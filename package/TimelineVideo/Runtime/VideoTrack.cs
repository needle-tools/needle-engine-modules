using System;
using UnityEngine;
using UnityEngine.Playables;
using UnityEngine.Timeline;
using UnityEngine.Video;

namespace Needle.TimelineVideo
{
    [Serializable]
    [TrackClipType(typeof(VideoPlayableAsset))]
    [TrackColor(0.008f, 0.698f, 0.655f)]
    [TrackBindingType(typeof(VideoPlayer))]
    public class VideoTrack : TrackAsset
    {
        public override Playable CreateTrackMixer(PlayableGraph graph, GameObject go, int inputCount)
        {
            foreach (var clip in GetClips())
            {
                var asset = clip.asset as VideoPlayableAsset;
                if (asset != null)
                {
                    asset.clipInTime = clip.clipIn;
                    asset.startTime = clip.start;
                }
            }

            return ScriptPlayable<VideoSchedulerPlayableBehaviour>.Create(graph, inputCount);
        }

        public override void GatherProperties(PlayableDirector director, IPropertyCollector driver)
        {
            base.GatherProperties(director, driver);
        }
    }
}
