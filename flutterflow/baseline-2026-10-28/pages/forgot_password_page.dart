@Page(route: '/')
class ForgotPasswordPage {
  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Column(
            children: [
              MainAppbar(
                title: 'Forgot password',
                isBack: false,
                isEdit: false,
                isShare: false,
              ),
              Expanded(
                Form(
                  child: ListView(
                    children: [
                      Text(
                        'Enter your email to verify. We’ll send a 4-digit code to your inbox',
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
                      Text(
                        'Email address',
                        style: bodyMedium,
                        textAlign: TextAlign.start,
                        lineHeight: 1.46,
                        fontSize: 15,
                        fontWeight: FontWeight.w400,
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          top: 24,
                          right: Constant('mainPadding'),
                        ),
                      ),
                      TextField(
                        hint: 'Enter email address',
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
                        submitType: SubmitType.done,
                        width: double.infinity,
                        setStateOnChanged: true,
                        debounceTime: 100,
                        requiredMessage: 'Please enter email address',
                        email: true,
                        emailMessage: 'Please enter valid email address',
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          top: 8,
                          right: Constant('mainPadding'),
                          bottom: 30,
                        ),
                      ),
                      Button(
                        'Continue',
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
                        ),
                        onTap: () {
                          if (appState.connected) {
                            ValidateForm('Form_ae3nju2v');
                            Wait(1000);
                            context.push(
                              ForgotVerificationsPage(
                                email: WidgetState('TextField_tnfr5dyu').text,
                              ),
                            );
                          } else {
                            internetSnackbar(shouldSetState: true);
                          }
                        },
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
      width: double.infinity,
      height: double.infinity,
    ),
    backgroundColor: bgColor,
    safeArea: false,
  );
}
