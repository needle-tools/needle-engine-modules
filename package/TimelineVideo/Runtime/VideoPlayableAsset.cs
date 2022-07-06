using System;
using UnityEngine;
using UnityEngine.Playables;
using UnityEngine.Timeline;
using UnityEngine.Video;

namespace Needle.TimelineVideo
{
    // Editor representation of a Clip to play video in Timeline.
    [Serializable]
    public class VideoPlayableAsset : PlayableAsset, ITimelineClipAsset
    {
        public enum RenderMode
        {
            CameraFarPlane,
            CameraNearPlane
        };

        [Tooltip("The video clip to play.")]
        public VideoClip videoClip;

        [Tooltip("Mutes the audio from the video")]
        public bool mute;

        [Tooltip("Loops the video.")]
        public bool loop = true;

        [Tooltip("The amount of time before the video begins to start preloading the video stream.")]
        public double preloadTime = 0.3;
        
        public double clipInTime { get; set; }
        public double startTime { get; set; }
        
        
        public override Playable CreatePlayable(PlayableGraph graph, GameObject go)
        {
            var playable = ScriptPlayable<VideoPlayableBehaviour>.Create(graph);
            // graph.GetResolver().GetReferenceValue()
            var playableBehaviour = playable.GetBehaviour();
            playableBehaviour.clip = this.videoClip;
            playableBehaviour.preloadTime = preloadTime;
            playableBehaviour.clipInTime = clipInTime;
            playableBehaviour.startTime = startTime;
            return playable;
        }

        public override double duration
        {
            get
            {
                if (videoClip == null)
                    return base.duration;
                return videoClip.length;
            }
        }

        public ClipCaps clipCaps
        {
            get
            {
                var caps = ClipCaps.Blending | ClipCaps.ClipIn | ClipCaps.SpeedMultiplier;
                if (loop)
                    caps |= ClipCaps.Looping;
                return caps;
            }
        }
    }
}
