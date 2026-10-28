@Component()
class DeleteAccountDialog {
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
              IconData('deleteaccountyp', custom: true),
              size: 42,
              color: primary,
            ),
            color: primaryLightColor,
            width: 80,
            alignment: Alignment.center,
            boxShape: BoxShape.circle,
          ),
          Text(
            'Are you sure you want to delete\n account?',
            style: bodyMedium,
            textAlign: TextAlign.center,
            lineHeight: 1.2,
            fontSize: 20,
            fontWeight: FontWeight.w700,
          ),
          Row(
            children: [
              Expanded(
                Button(
                  'No',
                  variant: ButtonVariant.outlined,
                  width: double.infinity,
                  height: 56,
                  borderRadius: 999,
                  style: titleSmall,
                  fontSize: 18,
                  lineHeight: 1,
                  innerPadding: EdgeInsets.only(left: 20, right: 20),
                  onTap: () {
                    DismissBottomSheet();
                  },
                ),
              ),
              Expanded(
                Button(
                  'Yes',
                  width: double.infinity,
                  height: 56,
                  borderRadius: 16,
                  style: titleSmall,
                  fontSize: 18,
                  lineHeight: 1,
                  elevation: 0,
                  innerPadding: EdgeInsets.only(left: 20, right: 20),
                  onTap: () {
                    ParamAction('onTapOk');
                  },
                ),
              ),
            ],
            mainAxis: MainAxis.spaceBetween,
            spacing: 16,
          ),
        ],
        mainAxis: MainAxis.center,
        spacing: 16,
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
