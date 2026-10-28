@Component()
class BlogComponent {
  final BolgModel detail;
  final UnsupportedAction onTapAction;
  final double width;
  build() => Container(
    child: Container(
      padding: EdgeInsets.all(16),
      child: Column(
        children: [
          Expanded(Container(color: Color(0x00FFFFFF))),
          Row(
            children: [
              Expanded(
                Text(
                  detail.desc ?? 'Desc',
                  style: bodyMedium,
                  color: Color(0xFFFFFFFF),
                  maxLines: 2,
                  textAlign: TextAlign.start,
                  lineHeight: 1.53,
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  padding: EdgeInsets.only(top: 4, bottom: 16),
                ),
              ),
            ],
          ),
          Row(
            children: [
              Icon(
                IconData('calendaryp', custom: true),
                size: 20,
                color: Color(0xFFFFFFFF),
              ),
              Text(
                detail.time ?? 'Time',
                style: bodyMedium,
                color: Color(0xFFFFFFFF),
                textAlign: TextAlign.start,
                lineHeight: 1.43,
                fontSize: 14,
                fontWeight: FontWeight.w400,
              ),
            ],
            spacing: 4,
          ),
        ],
        mainAxis: MainAxis.end,
        crossAxis: CrossAxis.start,
        minSize: MainAxisSize.min,
      ),
      borderRadius: 16,
      borderColor: Color(0x00000000),
      borderWidth: 1,
      width: width,
      height: 203,
      image: DecorationImage(
        path:
            detail.image ??
            'https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/84wxpcg29ejq/b1.png',
        type: ImageType.network,
      ),
      onTap: () {
        ParamAction('onTapAction');
      },
    ),
    color: Color(0x00000000),
    animations: [
      WidgetAnimation(
        effects: [
          FadeEffect(begin: 0.0, end: 1.0, delayMs: 0.0, durationMs: 300.0),
          SlideEffect(
            beginDx: 20.0,
            beginDy: 0.0,
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
