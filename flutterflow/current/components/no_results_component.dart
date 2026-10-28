@Component()
class NoResultsComponent {
  build() => Container(
    padding: EdgeInsets.only(
      left: Constant('mainPadding'),
      right: Constant('mainPadding'),
    ),
    child: Container(
      padding: EdgeInsets.only(left: 16, top: 20, right: 16, bottom: 20),
      child: Column(
        children: [
          Container(
            child: Icon('history_outlined', size: 42, color: primary),
            color: primaryBackground,
            width: 99,
            alignment: Alignment.center,
            boxShape: BoxShape.circle,
          ),
          Text(
            'No results yet',
            style: bodyMedium,
            textAlign: TextAlign.center,
            lineHeight: 1.3,
            fontSize: 20,
            fontWeight: FontWeight.w600,
            padding: EdgeInsets.only(top: 15, bottom: 3),
          ),
          Text(
            'Your results will appear here after your first scan',
            style: bodyMedium,
            color: secondaryText,
            textAlign: TextAlign.center,
            lineHeight: 1.52,
            fontSize: 17,
            fontWeight: FontWeight.w400,
            padding: EdgeInsets.only(bottom: 12),
          ),
          Button(
            'Start scanning',
            width: double.infinity,
            height: 56,
            borderRadius: 16,
            style: titleSmall,
            fontSize: 18,
            fontWeight: FontWeight.w600,
            lineHeight: 1,
            elevation: 0,
            innerPadding: EdgeInsets.only(left: 20, right: 20),
            padding: EdgeInsets.only(left: 32, right: 32),
            onTap: () {
              context.safePop();
            },
          ),
        ],
        minSize: MainAxisSize.min,
      ),
      color: buttonBg,
      borderRadius: 16,
      borderColor: borderColor,
      borderWidth: 1,
      width: double.infinity,
      margin: EdgeInsets.only(
        left: Constant('mainPadding'),
        right: Constant('mainPadding'),
      ),
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
