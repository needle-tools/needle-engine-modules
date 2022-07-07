using JetBrains.Annotations;
using UnityEditor.Timeline;
using UnityEngine;
using UnityEngine.Timeline;

namespace TimelineHtml.Editor
{
	[CustomTimelineEditor(typeof(CssPlayableAsset))]
	[UsedImplicitly]
	public class VideoAssetClipEditor : ClipEditor
	{
		public override void DrawBackground(TimelineClip clip, ClipBackgroundRegion region)
		{
			base.DrawBackground(clip, region);
			GUI.color = new Color(.15f, 0.4f, 0.95f);
			GUI.DrawTexture(region.position, Texture2D.whiteTexture, ScaleMode.StretchToFill);
			GUI.color = Color.white;
		}
	}
}