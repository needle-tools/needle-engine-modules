using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Playables;
using UnityEngine.Timeline;

public class CssPlayableAsset : PlayableAsset, ITimelineClipAsset
{
	[SerializeField]
	public string Query;
	[SerializeField]
	public string Class;

	public ClipCaps clipCaps { get; } = ClipCaps.None;
	
	public override Playable CreatePlayable(PlayableGraph graph, GameObject owner)
	{
		return new Playable();
	}
}
