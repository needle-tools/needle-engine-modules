using System;
using UnityEngine;
using UnityEngine.Playables;

namespace Needle.TimelineVideo
{
	// The runtime instance of the VideoTrack. It is responsible for letting the VideoPlayableBehaviours
	//  they need to start loading the video
	public sealed class VideoSchedulerPlayableBehaviour : PlayableBehaviour
	{
		// Called every frame that the timeline is evaluated. This is called prior to
		// PrepareFrame on any of its input playables.
		public override void PrepareFrame(Playable playable, FrameData info)
		{
			// Searches for clips that are in the 'preload' area and prepares them for playback
			var timelineTime = playable.GetGraph().GetRootPlayable(0).GetTime();
			var closestNext = -1;
			var anyActive = false;
			for (var i = 0; i < playable.GetInputCount(); i++)
			{
				if (playable.GetInput(i).GetPlayableType() != typeof(VideoPlayableBehaviour))
					continue;

				var scriptPlayable = (ScriptPlayable<VideoPlayableBehaviour>)playable.GetInput(i);
				var videoPlayableBehaviour = scriptPlayable.GetBehaviour();
				var clipStart = videoPlayableBehaviour.startTime;
				if (playable.GetInputWeight(i) <= 0.0f)
				{
					var preloadTime = Math.Max(0.0, videoPlayableBehaviour.preloadTime);

					if (timelineTime > clipStart - preloadTime && timelineTime <= clipStart)
					{
						videoPlayableBehaviour.PrepareVideo();
					}
					else if (closestNext == -1 && clipStart > timelineTime)
					{
						closestNext = i;
					}
				}
				else anyActive = true;
			}

			if (!anyActive && closestNext >= 0)
			{
				var scriptPlayable = (ScriptPlayable<VideoPlayableBehaviour>)playable.GetInput(closestNext);
				var videoPlayableBehaviour = scriptPlayable.GetBehaviour();
				videoPlayableBehaviour.OnBeforePlay();
			}
		}
	}
}