@Page(route: '/')
class SelectReasonPage {
  List<String> reasonList = [
    'No, thanks.',
    'I\'m not identifying watches often enough',
    'Missing important features',
    'The subscription is too expensive',
  ];
  String reasonName;
  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Column(
            children: [
              MainAppbar(
                title: 'Select reason',
                isBack: false,
                isEdit: false,
                isShare: false,
              ),
              Expanded(
                ListView(
                  children: [
                    Text(
                      'Why are you cancelling?',
                      style: bodyMedium,
                      textAlign: TextAlign.start,
                      lineHeight: 1.3,
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                      padding: EdgeInsets.only(
                        left: Constant('mainPadding'),
                        right: Constant('mainPadding'),
                      ),
                    ),
                    Text(
                      'Your feedback helps us improve your experience.',
                      style: bodyMedium,
                      color: secondaryText,
                      textAlign: TextAlign.start,
                      lineHeight: 1.46,
                      fontSize: 15,
                      fontWeight: FontWeight.w400,
                      padding: EdgeInsets.only(
                        left: Constant('mainPadding'),
                        top: 8,
                        right: Constant('mainPadding'),
                        bottom: 16,
                      ),
                    ),
                    Column(
                      children: [
                        Container(
                          padding: EdgeInsets.all(16),
                          child: Row(
                            children: [
                              ConditionalBuilder(
                                children: [
                                  PlaceholderWidget(
                                    children: [
                                      Icon(
                                        'radio_button_checked_rounded',
                                        size: 18,
                                        color: primary,
                                      ),
                                    ],
                                    visible: (ItemRef()) == reasonName,
                                  ),
                                  PlaceholderWidget(
                                    children: [
                                      Icon(
                                        'radio_button_off_rounded',
                                        size: 18,
                                        color: grey20,
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                              Expanded(
                                Text(
                                  ItemRef(),
                                  style: bodyMedium,
                                  textAlign: TextAlign.start,
                                  lineHeight: 1.52,
                                  fontSize: 17,
                                  fontWeight: FontWeight.w400,
                                ),
                              ),
                            ],
                            spacing: 8,
                          ),
                          color: buttonBg,
                          borderRadius: 12,
                          borderColor: borderColor,
                          borderWidth: 1,
                          width: double.infinity,
                          margin: EdgeInsets.only(
                            left: Constant('mainPadding'),
                            right: Constant('mainPadding'),
                          ),
                          onTap: () {
                            reasonName = ItemRef();
                          },
                        ),
                      ],
                      crossAxis: CrossAxis.start,
                      spacing: 16,
                      endSpacing: 16,
                    ),
                    Column(
                      children: [
                        Text(
                          'Other reason (optional)',
                          style: bodyMedium,
                          textAlign: TextAlign.start,
                          lineHeight: 1.46,
                          fontSize: 15,
                          fontWeight: FontWeight.w400,
                          padding: EdgeInsets.only(
                            left: Constant('mainPadding'),
                            right: Constant('mainPadding'),
                          ),
                        ),
                        TextField(
                          hint: 'Tell us more about your reason....',
                          maxLines: 5,
                          style: bodyMedium,
                          fontSize: 17,
                          lineHeight: 1.29,
                          hintStyle: labelMedium,
                          hintColor: secondaryText,
                          hintFontSize: 17,
                          hintFontWeight: FontWeight.w400,
                          hintLineHeight: 1.29,
                          errorStyle: bodyMedium,
                          errorColor: error,
                          errorFontSize: 15,
                          errorLineHeight: 1,
                          borderColor: borderColor,
                          borderRadius: 12,
                          focusBorderColor: primary,
                          errorBorderColor: error,
                          fillColor: buttonBg,
                          contentPadding: EdgeInsets.only(
                            left: 16,
                            top: 15,
                            right: 16,
                            bottom: 15,
                          ),
                          cursorColor: primaryText,
                          submitType: SubmitType.done,
                          width: double.infinity,
                          setStateOnChanged: true,
                          debounceTime: 100,
                          padding: EdgeInsets.only(
                            left: Constant('mainPadding'),
                            right: Constant('mainPadding'),
                          ),
                        ),
                      ],
                      crossAxis: CrossAxis.start,
                      spacing: 8,
                    ),
                  ],
                  primary: true,
                  startSpacing: 16,
                  endSpacing: 8,
                ),
              ),
              Button(
                'Continue Cancellation',
                width: double.infinity,
                height: 56,
                borderRadius: 16,
                disabled: !reasonName.isSet,
                style: titleSmall,
                fontSize: 18,
                fontWeight: FontWeight.w600,
                lineHeight: 1,
                elevation: 0,
                innerPadding: EdgeInsets.only(left: 20, right: 20),
                disabledColor: disableButton,
                disabledTextColor: grey,
                padding: EdgeInsets.only(
                  left: Constant('mainPadding'),
                  top: 12,
                  right: Constant('mainPadding'),
                  bottom: 16,
                ),
                onTap: () {
                  if (appState.connected) {
                    Wait(1000);
                    appState.isPro = false;
                    context.push(SubscriptionCancelPage(), allowBack: false);
                  } else {
                    internetSnackbar(shouldSetState: true);
                  }
                },
              ),
            ],
            crossAxis: CrossAxis.start,
          ),
          width: double.infinity,
          height: double.infinity,
          maxWidth: Constant('maxWidth'),
          safeArea: true,
        ),
        gradient: Gradient.linear([
          GradientStop(linearColor1, 0),
          GradientStop(linearColor2, 0.13),
          GradientStop(linearColor3, 1),
        ], angle: 0),
        outerAlignment: Alignment.topCenter,
      ),
      color: bgColor,
      width: double.infinity,
      height: double.infinity,
    ),
    backgroundColor: bgColor,
    safeArea: false,
  );
}
