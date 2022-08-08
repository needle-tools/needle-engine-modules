using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Playables;
using UnityEngine.Timeline;

namespace Needle.Timeline.Html
{
	public class CssPlayableAsset : PlayableAsset, ITimelineClipAsset
	{
		[SerializeField, Header("Clip Identifier")]
		public string Id;
		[Header("Dom Query")]
		[SerializeField]
		public string Query;
		[Header("CSS Properties")]
		[SerializeField]
		public string Class;

		public ClipCaps clipCaps { get; } = ClipCaps.None;
	
		public override Playable CreatePlayable(PlayableGraph graph, GameObject owner)
		{
			return new Playable();
		}
	}

}