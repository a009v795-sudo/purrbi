@Page(route: '/')
class HelpSupportPage {
  int helpTyprIndex = 0;
  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Column(
            children: [
              MainAppbar(
                title: 'Help & support',
                isBack: false,
                isEdit: false,
                isShare: false,
              ),
              Expanded(
                Form(
                  child: ListView(
                    children: [
                      Container(
                        child: MiniLogo(hight: 64.0, width: 64.0),
                        color: primaryLightColor,
                        borderColor: borderColor,
                        borderWidth: 1,
                        width: 114,
                        alignment: Alignment.center,
                        boxShape: BoxShape.circle,
                        outerAlignment: Alignment.topCenter,
                      ),
                      Text(
                        'How can we help?',
                        style: bodyMedium,
                        textAlign: TextAlign.center,
                        lineHeight: 1.25,
                        fontSize: 24,
                        fontWeight: FontWeight.w700,
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          top: 16,
                          right: Constant('mainPadding'),
                          bottom: 8,
                        ),
                      ),
                      Text(
                        'Report identification issues, request features, or share your feedback.',
                        style: bodyMedium,
                        color: secondaryText,
                        maxLines: 2,
                        textAlign: TextAlign.center,
                        lineHeight: 1.52,
                        fontSize: 17,
                        fontWeight: FontWeight.w400,
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          right: Constant('mainPadding'),
                          bottom: 50,
                        ),
                      ),
                      Row(
                        children: [
                          Container(
                            padding: EdgeInsets.only(
                              left: 16,
                              top: 8,
                              right: 16,
                              bottom: 8,
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  IconData('bugreportyp', custom: true),
                                  color:
                                      (helpTyprIndex == 0)
                                          ? Color(0xFFFFFFFF)
                                          : secondaryText,
                                ),
                                Text(
                                  'Bug report',
                                  style: bodyMedium,
                                  color:
                                      (helpTyprIndex == 0)
                                          ? Color(0xFFFFFFFF)
                                          : secondaryText,
                                  textAlign: TextAlign.start,
                                  lineHeight: 1.33,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w400,
                                ),
                              ],
                              spacing: 8,
                            ),
                            color: (helpTyprIndex == 0) ? primary : buttonBg,
                            borderRadius: 16,
                            borderColor:
                                (helpTyprIndex == 0) ? primary : borderColor,
                            borderWidth: 1,
                            onTap: () {
                              helpTyprIndex = 0;
                            },
                          ),
                          Container(
                            padding: EdgeInsets.only(
                              left: 16,
                              top: 8,
                              right: 16,
                              bottom: 8,
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  IconData('smartyogaguideyp', custom: true),
                                  color:
                                      (helpTyprIndex == 1)
                                          ? Color(0xFFFFFFFF)
                                          : secondaryText,
                                ),
                                Text(
                                  'Feature request',
                                  style: bodyMedium,
                                  color:
                                      (helpTyprIndex == 1)
                                          ? Color(0xFFFFFFFF)
                                          : secondaryText,
                                  textAlign: TextAlign.start,
                                  lineHeight: 1.33,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w400,
                                ),
                              ],
                              spacing: 8,
                            ),
                            color: (helpTyprIndex == 1) ? primary : buttonBg,
                            borderRadius: 16,
                            borderColor:
                                (helpTyprIndex == 1) ? primary : borderColor,
                            borderWidth: 1,
                            onTap: () {
                              helpTyprIndex = 1;
                            },
                          ),
                          Container(
                            padding: EdgeInsets.only(
                              left: 16,
                              top: 8,
                              right: 16,
                              bottom: 8,
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  IconData('infoyp', custom: true),
                                  color:
                                      (helpTyprIndex == 2)
                                          ? Color(0xFFFFFFFF)
                                          : secondaryText,
                                ),
                                Text(
                                  'General inquiry',
                                  style: bodyMedium,
                                  color:
                                      (helpTyprIndex == 2)
                                          ? Color(0xFFFFFFFF)
                                          : secondaryText,
                                  textAlign: TextAlign.start,
                                  lineHeight: 1.33,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w400,
                                ),
                              ],
                              spacing: 8,
                            ),
                            color: (helpTyprIndex == 2) ? primary : buttonBg,
                            borderRadius: 16,
                            borderColor:
                                (helpTyprIndex == 2) ? primary : borderColor,
                            borderWidth: 1,
                            onTap: () {
                              helpTyprIndex = 2;
                            },
                          ),
                        ],
                        spacing: 16,
                        scrollable: true,
                        startSpacing: 16,
                        endSpacing: 16,
                        padding: EdgeInsets.only(bottom: 16),
                      ),
                      Text(
                        'Your Email',
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
                        hint: 'Enter your email',
                        keyboard: Keyboard.email,
                        maxLines: 1,
                        style: bodyMedium,
                        fontSize: 17,
                        lineHeight: 1,
                        hintStyle: labelMedium,
                        hintColor: secondaryText,
                        hintFontSize: 17,
                        hintFontWeight: FontWeight.w400,
                        hintLineHeight: 1,
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
                        submitType: SubmitType.next,
                        width: double.infinity,
                        setStateOnChanged: true,
                        debounceTime: 100,
                        requiredMessage: 'Please enter valid email address',
                        email: true,
                        emailMessage: 'Please enter valid email address',
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          top: 8,
                          right: Constant('mainPadding'),
                          bottom: 16,
                        ),
                      ),
                      Text(
                        'What’s on your mind?',
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
                        hint: 'Describe your issue or feedback in detail...',
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
                        maxChars: 1000,
                        maxCharsEnforcement: MaxLengthEnforcement.notEnforced,
                        submitType: SubmitType.done,
                        width: double.infinity,
                        setStateOnChanged: true,
                        debounceTime: 100,
                        required: true,
                        requiredMessage: 'Please enter description',
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          top: 8,
                          right: Constant('mainPadding'),
                          bottom: 4,
                        ),
                      ),
                    ],
                    primary: true,
                    startSpacing: 24,
                    endSpacing: 12,
                  ),
                ),
              ),
              Column(
                children: [
                  Button(
                    'Submit your feedback',
                    width: double.infinity,
                    height: 56,
                    borderRadius: 16,
                    style: titleSmall,
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    lineHeight: 1,
                    elevation: 0,
                    innerPadding: EdgeInsets.only(left: 20, right: 20),
                    onTap: () {
                      if (appState.connected) {
                        ValidateForm('Form_1ouxpbbu');
                        SendEmail(
                          WidgetState('TextField_f0jshnom').text,
                          subject:
                              (helpTyprIndex == 0)
                                  ? 'Bug report'
                                  : (helpTyprIndex == 1)
                                  ? 'Feature request'
                                  : 'General inquiry',
                          body: WidgetState('TextField_r6g8te7a').text,
                        );
                      } else {
                        internetSnackbar(shouldSetState: true);
                      }
                    },
                  ),
                  RichText(
                    style: bodyMedium,
                    spans: [
                      RichTextSpan(
                        'Or email us directly at ',
                        color: secondaryText,
                        fontSize: 17,
                        style: bodyMedium,
                        lineHeight: 1.29,
                      ),
                      RichTextSpan(
                        'support@watchai.app',
                        color: primary,
                        fontSize: 17,
                        bold: true,
                        style: bodyMedium,
                        lineHeight: 1.28,
                      ),
                      RichTextSpan(null),
                    ],
                    textAlign: TextAlign.center,
                    fontSize: 17,
                    lineHeight: 1.29,
                  ),
                ],
                spacing: 16,
                padding: EdgeInsets.only(
                  left: Constant('mainPadding'),
                  top: 12,
                  right: Constant('mainPadding'),
                  bottom: 16,
                ),
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
