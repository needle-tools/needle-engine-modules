using JetBrains.Annotations;
using UnityEditor;
using UnityEditor.Timeline;
using UnityEngine;
using UnityEngine.Timeline;

namespace TimelineHtml.Editor
{

	[CustomTimelineEditor(typeof(CssTrack))]
	[UsedImplicitly]
	public class CssTrackEditor : TrackEditor
	{
		private Texture2D icon;
		
		public override TrackDrawOptions GetTrackOptions(TrackAsset track, Object binding)
		{
			var opts = base.GetTrackOptions(track, binding);
			if (!icon) icon = AssetDatabase.LoadAssetAtPath<Texture2D>(AssetDatabase.GUIDToAssetPath("297f5203957bd664b8f034858162ccda"));
			opts.icon = icon;
			return opts;
		}
	}

	[CustomTimelineEditor(typeof(CssPlayableAsset))]
	[UsedImplicitly]
	public class CssClipEditor : ClipEditor
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