@Component()
class Noidentificate {
  build() => Container(
    padding: EdgeInsets.only(
      left: Constant('mainPadding'),
      right: Constant('mainPadding'),
    ),
    child: Container(
      padding: EdgeInsets.all(20),
      child: Column(
        children: [
          Container(
            child: Icon('home', size: 42, color: primary),
            color: primaryBackground,
            width: 99,
            alignment: Alignment.center,
            boxShape: BoxShape.circle,
          ),
          Text(
            'Your saved items will appear here once you add them',
            style: bodyMedium,
            textAlign: TextAlign.center,
            lineHeight: 1.3,
            fontSize: 20,
            fontWeight: FontWeight.w700,
            padding: EdgeInsets.only(top: 16, bottom: 8),
          ),
          Text(
            'Nothing added yet',
            style: bodyMedium,
            textAlign: TextAlign.center,
            lineHeight: 1.29,
            fontSize: 17,
            fontWeight: FontWeight.w400,
            padding: EdgeInsets.only(bottom: 16),
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
            padding: EdgeInsets.only(left: 8, right: 8),
          ),
        ],
        minSize: MainAxisSize.min,
      ),
      color: secondaryBackground,
      borderRadius: 16,
      borderColor: borderColor,
      margin: EdgeInsets.only(
        left: Constant('mainPadding'),
        right: Constant('mainPadding'),
      ),
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
