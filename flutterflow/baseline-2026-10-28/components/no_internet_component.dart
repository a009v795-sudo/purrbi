@Component()
class NoInternetComponent {
  build() => Container(
    child: Lottie(
      'projects/main-project-dark-theme-kpiqrs/assets/ciqk91yt0wam/No_Wifi.json',
      source: AnimationSource.asset,
      width: 150,
      height: 150,
      outerAlignment: Alignment.center,
    ),
    color: Color(0x00000000),
    animations: [
      WidgetAnimation(
        effects: [
          FadeEffect(begin: 0.0, end: 1.0, delayMs: 0.0, durationMs: 350.0),
          ScaleEffect(
            beginDx: 0.88,
            endDx: 1.0,
            beginDy: 0.88,
            endDy: 1.0,
            delayMs: 0.0,
            durationMs: 350.0,
          ),
        ],
        applyInitialState: true,
        hideBeforeAnimating: true,
      ),
    ],
  );
}
