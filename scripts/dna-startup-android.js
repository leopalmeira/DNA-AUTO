module.exports = function startupActivity() {
  return `
    private android.widget.FrameLayout startupOverlay;
    private android.widget.VideoView startupVideo;
    private final Runnable startupTimeout = this::finishStartup;

    private void showStartup() {
        startupOverlay = new android.widget.FrameLayout(this);
        startupOverlay.setBackgroundColor(Color.parseColor("#07101a"));
        startupOverlay.setClickable(true);
        startupOverlay.setContentDescription("Carregando DNA AUTO");

        android.widget.ImageView poster = new android.widget.ImageView(this);
        poster.setImageResource(R.drawable.dna_startup_poster);
        poster.setScaleType(android.widget.ImageView.ScaleType.FIT_CENTER);

        if (Build.VERSION.SDK_INT < 26 || android.animation.ValueAnimator.areAnimatorsEnabled()) {
            startupVideo = new android.widget.VideoView(this);
            startupOverlay.addView(startupVideo, startupLayout());
            startupVideo.setOnPreparedListener(player -> {
                player.setLooping(true);
                player.setVolume(0f, 0f);
            });
            startupVideo.setOnInfoListener((player, what, extra) -> {
                if (what == android.media.MediaPlayer.MEDIA_INFO_VIDEO_RENDERING_START) {
                    poster.setVisibility(View.GONE);
                    return true;
                }
                return false;
            });
            startupVideo.setOnErrorListener((player, what, extra) -> {
                poster.setVisibility(View.VISIBLE);
                startupVideo.setVisibility(View.GONE);
                return true;
            });
            startupVideo.setVideoURI(android.net.Uri.parse(
                "android.resource://" + getPackageName() + "/" + R.raw.dna_startup));
        }

        startupOverlay.addView(poster, startupLayout());
        addContentView(startupOverlay, startupLayout());
        startupOverlay.postDelayed(startupTimeout, 15000);
    }

    private android.widget.FrameLayout.LayoutParams startupLayout() {
        return new android.widget.FrameLayout.LayoutParams(
            android.view.ViewGroup.LayoutParams.MATCH_PARENT,
            android.view.ViewGroup.LayoutParams.MATCH_PARENT,
            android.view.Gravity.CENTER);
    }

    private void finishStartup() {
        if (startupOverlay == null) return;
        startupOverlay.removeCallbacks(startupTimeout);
        if (startupVideo != null) {
            startupVideo.stopPlayback();
            startupVideo = null;
        }
        ((android.view.ViewGroup) startupOverlay.getParent()).removeView(startupOverlay);
        startupOverlay = null;
    }

    @Override
    public void onResume() {
        super.onResume();
        if (startupVideo != null) startupVideo.start();
    }

    @Override
    public void onPause() {
        if (startupVideo != null) startupVideo.pause();
        super.onPause();
    }

    @Override
    public void onDestroy() {
        finishStartup();
        super.onDestroy();
    }

    @com.getcapacitor.annotation.CapacitorPlugin(name = "DnaStartup")
    public static class StartupPlugin extends com.getcapacitor.Plugin {
        @com.getcapacitor.PluginMethod
        public void finish(com.getcapacitor.PluginCall call) {
            MainActivity activity = (MainActivity) getActivity();
            activity.runOnUiThread(() -> {
                activity.finishStartup();
                call.resolve();
            });
        }
    }
`;
};
