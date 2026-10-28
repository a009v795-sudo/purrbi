@Component()
class MiniLogo {
  final double hight;
  final double width;
  build() => Container(
    child: Image(
      'projects/a-i-barcode-identifier-app-ahbvz7/assets/u00gl6ef3s25/app-logo-barcode.png',
      isNetwork: false,
      fit: ImageFit.contain,
      width: width,
      height: hight,
      borderRadius: 0,
    ),
    color: Color(0x00000000),
    animations: [
      WidgetAnimation(
        effects: [
          FadeEffect(begin: 0.0, end: 1.0, delayMs: 0.0, durationMs: 400.0),
          ScaleEffect(
            beginDx: 1.08,
            endDx: 1.0,
            beginDy: 1.08,
            endDy: 1.0,
            delayMs: 0.0,
            durationMs: 400.0,
          ),
        ],
        applyInitialState: true,
        hideBeforeAnimating: true,
      ),
    ],
  );
}
