using System;
using UnityEngine;
using UnityEngine.Playables;
using UnityEngine.Timeline;

namespace Needle.Timeline.Html
{
	[Serializable]
	[TrackClipType(typeof(CssPlayableAsset))]
	[TrackColor(.12f, 0.3f, 0.9f)]
	public class CssTrack : TrackAsset
	{
		public override Playable CreateTrackMixer(PlayableGraph graph, GameObject go, int inputCount)
		{
			foreach (var clip in GetClips())
			{
				if (clip.asset is CssPlayableAsset css)
				{
					clip.displayName = css.Query + " × " + css.Class;
				}
			}
			return base.CreateTrackMixer(graph, go, inputCount);
		}
	}

}