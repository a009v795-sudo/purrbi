@Component()
class CenterAppbar {
  final String title;
  build() => Container(
    padding: EdgeInsets.only(
      left: Constant('mainPadding'),
      top: 16,
      right: Constant('mainPadding'),
      bottom: 16,
    ),
    child: Row(
      children: [
        Expanded(
          Text(
            title ?? 'Title',
            style: bodyMedium,
            maxLines: 1,
            textAlign: TextAlign.center,
            overflow: TextOverflow.ellipsis,
            lineHeight: 1.2,
            fontSize: 20,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
      mainAxis: MainAxis.center,
      animations: [
        WidgetAnimation(
          effects: [
            SlideEffect(
              beginDx: 0,
              beginDy: -50.0,
              endDx: 0,
              endDy: 0,
              delayMs: 50.0,
              durationMs: 400.0,
            ),
          ],
          applyInitialState: true,
        ),
      ],
    ),
    color: Color(0x00000000),
    animations: [
      WidgetAnimation(
        effects: [
          FadeEffect(begin: 0.0, end: 1.0, delayMs: 0.0, durationMs: 300.0),
          SlideEffect(
            beginDx: 0.0,
            beginDy: -20.0,
            endDx: 0.0,
            endDy: 0.0,
            delayMs: 0.0,
            durationMs: 300.0,
          ),
        ],
        applyInitialState: true,
        hideBeforeAnimating: true,
      ),
    ],
  );
}
