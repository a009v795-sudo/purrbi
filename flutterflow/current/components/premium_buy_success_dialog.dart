@Component()
class PremiumBuySuccessDialog {
  final UnsupportedAction onTapOk;
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
            child: Icon(
              IconData('checkcircleuyp', custom: true),
              size: 32,
              color: primary,
            ),
            color: primaryLightColor,
            width: 80,
            alignment: Alignment.center,
            boxShape: BoxShape.circle,
          ),
          Text(
            'You’re a Pro Member!',
            style: bodyMedium,
            textAlign: TextAlign.center,
            lineHeight: 1.2,
            fontSize: 20,
            fontWeight: FontWeight.w600,
            padding: EdgeInsets.only(top: 16, bottom: 10),
          ),
          Text(
            'Unlock unlimited AI. Upgrade for premium tools and faster performance.',
            style: bodyMedium,
            color: secondaryText,
            textAlign: TextAlign.center,
            lineHeight: 1.33,
            fontSize: 15,
            fontWeight: FontWeight.w400,
            padding: EdgeInsets.only(bottom: 18),
          ),
          Container(
            padding: EdgeInsets.only(left: 16, top: 10, right: 16, bottom: 10),
            child: Column(
              children: [
                Row(
                  children: [
                    Text(
                      'Plan',
                      style: bodyMedium,
                      textAlign: TextAlign.start,
                      lineHeight: 1.29,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                    Expanded(
                      Text(
                        'Annual pro',
                        style: bodyMedium,
                        textAlign: TextAlign.end,
                        lineHeight: 1.33,
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                  mainAxis: MainAxis.spaceBetween,
                  crossAxis: CrossAxis.start,
                  spacing: 4,
                ),
                Row(
                  children: [
                    Text(
                      'Date',
                      style: bodyMedium,
                      textAlign: TextAlign.start,
                      lineHeight: 1.29,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                    Expanded(
                      Text(
                        'Jan 12,2026',
                        style: bodyMedium,
                        textAlign: TextAlign.end,
                        lineHeight: 1.33,
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                  mainAxis: MainAxis.spaceBetween,
                  crossAxis: CrossAxis.start,
                  spacing: 4,
                ),
                Row(
                  children: [
                    Text(
                      'Amount',
                      style: bodyMedium,
                      textAlign: TextAlign.start,
                      lineHeight: 1.29,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                    Expanded(
                      Text(
                        '${appState.currencyType}40.00',
                        style: bodyMedium,
                        color: primary,
                        textAlign: TextAlign.end,
                        lineHeight: 1.33,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                  mainAxis: MainAxis.spaceBetween,
                  crossAxis: CrossAxis.start,
                  spacing: 4,
                ),
              ],
              crossAxis: CrossAxis.start,
              spacing: 8,
            ),
            color: primaryLightColor,
            borderRadius: 16,
            width: double.infinity,
            margin: EdgeInsets.only(bottom: 16),
          ),
          Button(
            'Go to home',
            width: double.infinity,
            height: 56,
            borderRadius: 16,
            style: titleSmall,
            fontSize: 18,
            fontWeight: FontWeight.w600,
            lineHeight: 1,
            elevation: 0,
            innerPadding: EdgeInsets.only(left: 20, right: 20),
            padding: EdgeInsets.only(bottom: 16),
            onTap: () {
              ParamAction('onTapOk');
            },
          ),
          Text(
            'Receipt sent to ${appState.userDetail.email}',
            style: bodyMedium,
            color: secondaryText,
            textAlign: TextAlign.center,
            lineHeight: 1.31,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ],
        mainAxis: MainAxis.center,
        minSize: MainAxisSize.min,
      ),
      color: buttonBg,
      borderRadius: 16,
      width:
          (globalProperties.screenWidth > (Constant('maxWidth')))
              ? ((Constant('maxWidth')) - 32)
              : constants.infinity,
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
          FadeEffect(begin: 0.0, end: 1.0, delayMs: 0.0, durationMs: 300.0),
          ScaleEffect(
            beginDx: 0.92,
            endDx: 1.0,
            beginDy: 0.92,
            endDy: 1.0,
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
