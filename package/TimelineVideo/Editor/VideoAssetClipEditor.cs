using JetBrains.Annotations;
using UnityEditor;
using UnityEditor.Timeline;
using UnityEngine;
using UnityEngine.Timeline;

namespace Needle.TimelineVideo.Editor
{
    [CustomTimelineEditor(typeof(VideoPlayableAsset))]
    [UsedImplicitly]
    public class VideoAssetClipEditor : ClipEditor
    {
        public override void DrawBackground(TimelineClip clip, ClipBackgroundRegion region)
        {
            var videoAsset = clip.asset as VideoPlayableAsset;
            if (videoAsset != null && videoAsset.videoClip != null)
            {
                Texture texturePreview = AssetPreview.GetAssetPreview(videoAsset.videoClip);
                if (texturePreview == null)
                    texturePreview = AssetPreview.GetMiniThumbnail(videoAsset.videoClip);

                if (texturePreview != null)
                {
                    var rect = region.position;
                    rect.width = texturePreview.width * rect.height / texturePreview.height;
                    GUI.DrawTexture(rect, texturePreview, ScaleMode.StretchToFill);
                }
            }
        }
    }
}
