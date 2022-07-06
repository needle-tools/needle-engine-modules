using UnityEngine;
using UnityEngine.Playables;
using UnityEngine.Video;

namespace Needle.TimelineVideo
{
	// The runtime instance of a video clip player in Timeline.
	public sealed class VideoPlayableBehaviour : PlayableBehaviour
	{
		private VideoPlayer videoPlayer;

		public VideoClip clip;
		public double preloadTime;
		public double clipInTime;
		public double startTime;

		private bool preparing;

		// Called by the mixer (VideoSchedulerPlayableBehaviour) when this is nearly active to
		// give the video time to load.
		public void PrepareVideo()
		{
			if (videoPlayer == null || videoPlayer.isPrepared || preparing)
				return;

			videoPlayer.targetCameraAlpha = 0.0f;
			videoPlayer.time = clipInTime;
			videoPlayer.Prepare();
			preparing = true;
		}

		public override void PrepareFrame(Playable playable, FrameData info)
		{
			if (!videoPlayer || videoPlayer == null)
				return;
			if (!clip)
				return;

			videoPlayer.clip = clip;

			bool shouldBePlaying = info.evaluationType == FrameData.EvaluationType.Playback;
			if (!videoPlayer.isLooping && playable.GetTime() >= videoPlayer.clip.length)
				shouldBePlaying = false;

			if (shouldBePlaying)
			{
				videoPlayer.timeReference = VideoTimeReference.ExternalTime;
				if (!videoPlayer.isPlaying)
					videoPlayer.Play();
				videoPlayer.externalReferenceTime = playable.GetTime() / videoPlayer.playbackSpeed;
			}
			else
			{
				videoPlayer.timeReference = VideoTimeReference.Freerun;
				if (!videoPlayer.isPaused)
					videoPlayer.Pause();
				SyncVideoTime(playable);
			}


			videoPlayer.targetCameraAlpha = info.effectiveWeight;
			if (videoPlayer.audioOutputMode == VideoAudioOutputMode.Direct)
			{
				for (ushort i = 0; i < videoPlayer.clip.audioTrackCount; ++i)
					videoPlayer.SetDirectAudioVolume(i, info.effectiveWeight);
			}
		}

		public override void ProcessFrame(Playable playable, FrameData info, object playerData)
		{
			videoPlayer = playerData as VideoPlayer;
			if (!videoPlayer) return;

			SyncVideoTime(playable);
			base.ProcessFrame(playable, info, playerData);
		}


		public override void OnBehaviourPlay(Playable playable, FrameData info)
		{
			if (videoPlayer == null)
				return;

			SyncVideoTime(playable);
			videoPlayer.playbackSpeed = Mathf.Clamp(info.effectiveSpeed, 1 / 10f, 10f);
			videoPlayer.Play();
			preparing = false;
		}

		public override void OnBehaviourPause(Playable playable, FrameData info)
		{
			if (videoPlayer == null)
				return;

			preparing = false;

			if (info.effectiveWeight <= 0)
				videoPlayer.Stop();
			else
				videoPlayer.Pause();
		}

		internal void OnBeforePlay()
		{
			if (videoPlayer)
			{
				PrepareVideo();
				videoPlayer.time = clipInTime;
				videoPlayer.playbackSpeed = 0;
				videoPlayer.Play();
			}
		}

		private void SyncVideoTime(Playable playable)
		{
			if (videoPlayer == null || videoPlayer.clip == null)
				return;

			var t = playable.GetTime();

			if (videoPlayer.isLooping)
			{
				videoPlayer.time = t % videoPlayer.clip.length;
			}
			else
			{
				videoPlayer.time = System.Math.Min(t, videoPlayer.clip.length);
			}
		}
	}
}