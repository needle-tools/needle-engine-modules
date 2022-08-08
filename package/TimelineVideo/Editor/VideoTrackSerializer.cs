using Needle.Engine.Timeline;
using UnityEditor;
using UnityEngine.Video;

namespace Needle.TimelineVideo.Editor
{
	internal static class VideoTrackSerializer
	{
		[InitializeOnLoadMethod]
		private static void Init()
		{
			TimelineSerializer.CreateModel -= OnCreateModel;
			TimelineSerializer.CreateModel += OnCreateModel;
		}

		private static void OnCreateModel(object asset, ref object model)
		{
			if (asset is VideoPlayableAsset videoAsset)
			{
				model = new VideoTrackModel()
				{
					clip = videoAsset.videoClip
				};
			}
		}

		private class VideoTrackModel
		{
			public VideoClip clip;
		}
	}
}