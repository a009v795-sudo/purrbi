@Page(route: '/')
class VerificationsPage {
  final String email;
  bool isShow = false;
  onLoad() {
    TimerControl.reset();
    TimerControl.start();
  }

  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Column(
            children: [
              MainAppbar(title: 'Verifications', isBack: false, isEdit: false),
              Expanded(
                Form(
                  child: ListView(
                    children: [
                      Text(
                        'We’ve sent a 4-digit verification code to your registered email address',
                        style: bodyMedium,
                        textAlign: TextAlign.start,
                        lineHeight: 1.52,
                        fontSize: 17,
                        fontWeight: FontWeight.w400,
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          right: Constant('mainPadding'),
                        ),
                      ),
                      RichText(
                        style: bodyMedium,
                        spans: [
                          RichTextSpan(
                            'Code sent to ',
                            fontSize: 17,
                            style: bodyMedium,
                            lineHeight: 1.29,
                          ),
                          RichTextSpan(
                            email ?? 'Email',
                            fontSize: 17,
                            bold: true,
                            style: bodyMedium,
                            lineHeight: 1.29,
                          ),
                        ],
                        textAlign: TextAlign.center,
                        fontSize: 17,
                        lineHeight: 1.29,
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          top: 24,
                          right: Constant('mainPadding'),
                          bottom: 16,
                        ),
                      ),
                      PinCode(
                        textStyle: TextStyle(
                          style: bodyLarge,
                          fontSize: 18,
                          lineHeight: 1,
                        ),
                        shape: PinCodeFieldShape.box,
                        enableActiveFill: true,
                        showCursor: true,
                        errorTextSpace: 16,
                        keyboardType: Keyboard.number,
                        required: true,
                        requiredMessage: 'Please enter valid OTP',
                        mainAxisAlignment: MainAxis.spaceEvenly,
                        fieldHeight: 50,
                        fieldWidth: 50,
                        borderWidth: 1,
                        activeColor: primary,
                        selectedColor: primary,
                        inactiveColor: borderColor,
                        cursorColor: primaryText,
                        activeFillColor: buttonBg,
                        selectedFillColor: buttonBg,
                        inactiveFillColor: buttonBg,
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          right: Constant('mainPadding'),
                          bottom: 16,
                        ),
                      ),
                      Button(
                        'Verify',
                        width: double.infinity,
                        height: 56,
                        borderRadius: 16,
                        style: titleSmall,
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        lineHeight: 1,
                        elevation: 0,
                        innerPadding: EdgeInsets.only(left: 20, right: 20),
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          right: Constant('mainPadding'),
                          bottom: 16,
                        ),
                        onTap: () {
                          if (appState.connected) {
                            ValidateForm('Form_ur7lliyi');
                            Wait(1000);
                            context.push(
                              PremiumPage(isEmpty: ''),
                              allowBack: false,
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
                            'Don’t receive code? ',
                            fontSize: 17,
                            style: bodyMedium,
                            lineHeight: 1.29,
                          ),
                          RichTextSpan(
                            'Resend code',
                            color: isShow ? primary : secondaryText,
                            fontSize: 17,
                            bold: true,
                            style: bodyMedium,
                            lineHeight: 1.29,
                          ),
                        ],
                        textAlign: TextAlign.center,
                        fontSize: 17,
                        lineHeight: 1.29,
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          right: Constant('mainPadding'),
                          bottom: 24,
                        ),
                        onTap: () {
                          if (isShow) {
                            TimerControl.reset();
                            TimerControl.start();
                            isShow = false;
                            mainSanckbar(
                              title: 'OTP Resend!',
                              shouldSetState: true,
                            );
                          }
                        },
                      ),
                      Row(
                        children: [
                          Container(
                            padding: EdgeInsets.only(
                              left: 16,
                              top: 10,
                              right: 16,
                              bottom: 10,
                            ),
                            child: Row(
                              children: [
                                Text(
                                  'Code expires in ',
                                  style: bodyMedium,
                                  textAlign: TextAlign.start,
                                  lineHeight: 1.46,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w400,
                                ),
                                Timer(
                                  presetMilliseconds: 60000,
                                  onTimerEnd: () {
                                    TimerControl.stop();
                                    isShow = true;
                                  },
                                ),
                              ],
                              mainAxis: MainAxis.center,
                              spacing: 4,
                            ),
                            color: primaryLightColor,
                            borderRadius: 24,
                            borderColor: primary,
                            borderWidth: 1,
                          ),
                        ],
                        mainAxis: MainAxis.center,
                      ),
                    ],
                    primary: true,
                    startSpacing: 16,
                    endSpacing: 16,
                  ),
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
      color: primaryBackground,
      width: double.infinity,
      height: double.infinity,
    ),
    backgroundColor: bgColor,
    safeArea: false,
  );
}
