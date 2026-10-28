@Page(route: '/')
class SignInPage {
  bool isCheck = true;
  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Column(
            children: [
              Column(
                children: [
                  Container(
                    child: MiniLogo(hight: 39.0, width: 39.0),
                    color: primaryBackground,
                    borderRadius: 12,
                    borderColor: borderColor,
                    borderWidth: 1,
                    width: 70,
                    height: 70,
                    alignment: Alignment.center,
                  ),
                  Text(
                    'Welcome back',
                    style: bodyMedium,
                    textAlign: TextAlign.start,
                    lineHeight: 1.21,
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                    padding: EdgeInsets.only(top: 16, bottom: 8),
                  ),
                  Text(
                    'Log in for quick and easy access to your account',
                    style: bodyMedium,
                    color: secondaryText,
                    textAlign: TextAlign.start,
                    lineHeight: 1.46,
                    fontSize: 15,
                    fontWeight: FontWeight.w400,
                  ),
                ],
                crossAxis: CrossAxis.start,
                startSpacing: 24,
                endSpacing: 8,
                padding: EdgeInsets.only(
                  left: Constant('mainPadding'),
                  right: Constant('mainPadding'),
                ),
              ),
              Expanded(
                Form(
                  child: ListView(
                    children: [
                      Text(
                        'Email address',
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
                        hint: 'Enter email address',
                        keyboard: Keyboard.email,
                        maxLines: 1,
                        initialText: appState.userDetail.email,
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
                        borderRadius: 16,
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
                        requiredMessage: 'Please enter email address',
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
                        'Password',
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
                        hint: 'Enter password',
                        suffixIconColor: primaryText,
                        suffixIconSize: 24,
                        keyboard: Keyboard.visiblePassword,
                        obscureText: true,
                        initialText: appState.userDetail.password,
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
                        borderRadius: 16,
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
                        required: true,
                        requiredMessage: 'Please enter password',
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          top: 8,
                          right: Constant('mainPadding'),
                          bottom: 16,
                        ),
                      ),
                      Text(
                        'Forgot password?',
                        style: bodyMedium,
                        textAlign: TextAlign.end,
                        lineHeight: 1.52,
                        fontSize: 17,
                        fontWeight: FontWeight.w500,
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          right: Constant('mainPadding'),
                          bottom: 30,
                        ),
                        onTap: () {
                          context.push(ForgotPasswordPage());
                        },
                      ),
                      Button(
                        'Log in',
                        width: double.infinity,
                        height: 56,
                        borderRadius: 99,
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
                            ValidateForm('Form_8754f0tm');
                            Wait(1000);
                            SetState.batch([
                              appState.isLogin = true,
                              appState.userDetail
                                ..email = WidgetState('TextField_s4n6igk6').text
                                ..password =
                                    WidgetState('TextField_6rxrczlb').text,
                              appState.homePageIndex = 0,
                              appState.isPro = false,
                            ]);
                            context.push(HomeMainPage(), allowBack: false);
                          } else {
                            internetSnackbar(shouldSetState: true);
                          }
                        },
                      ),
                      Row(
                        children: [
                          Expanded(
                            Container(
                              color: borderColor,
                              width: double.infinity,
                              height: 1,
                            ),
                          ),
                          Text(
                            'Or',
                            style: bodyMedium,
                            textAlign: TextAlign.start,
                            lineHeight: 1.46,
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                          ),
                          Expanded(
                            Container(
                              color: borderColor,
                              width: double.infinity,
                              height: 1,
                            ),
                          ),
                        ],
                        spacing: 7,
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          top: 16,
                          right: Constant('mainPadding'),
                        ),
                      ),
                      Row(
                        children: [
                          Expanded(
                            Container(
                              padding: EdgeInsets.only(
                                left: 16,
                                top: 16,
                                right: 16,
                                bottom: 16,
                              ),
                              child: Row(
                                children: [
                                  Image(
                                    'projects/chirag-ev-point-app-px5gfy/assets/q7kcnd2qo8gj/google_ic.svg',
                                    isNetwork: false,
                                    fit: ImageFit.contain,
                                    width: 24,
                                    height: 24,
                                    borderRadius: 0,
                                    format: ImageFormat.svg,
                                  ),
                                  Text(
                                    'Google',
                                    style: bodyMedium,
                                    maxLines: 1,
                                    textAlign: TextAlign.start,
                                    lineHeight: 1.33,
                                    fontSize: 18,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ],
                                mainAxis: MainAxis.center,
                                spacing: 8,
                              ),
                              color: buttonBg,
                              borderRadius: 99,
                              borderColor: borderColor,
                              borderWidth: 1,
                              height: 56,
                              alignment: Alignment.center,
                            ),
                          ),
                          Expanded(
                            Container(
                              padding: EdgeInsets.only(
                                left: 16,
                                top: 16,
                                right: 16,
                                bottom: 16,
                              ),
                              child: Row(
                                children: [
                                  Icon('apple_sharp', color: primaryText),
                                  Text(
                                    'Apple',
                                    style: bodyMedium,
                                    maxLines: 1,
                                    textAlign: TextAlign.start,
                                    lineHeight: 1.33,
                                    fontSize: 18,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ],
                                mainAxis: MainAxis.center,
                                spacing: 8,
                              ),
                              color: buttonBg,
                              borderRadius: 99,
                              borderColor: borderColor,
                              borderWidth: 1,
                              width: double.infinity,
                              height: 56,
                              alignment: Alignment.center,
                            ),
                          ),
                        ],
                        mainAxis: MainAxis.spaceBetween,
                        spacing: 16,
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          top: 16,
                          right: Constant('mainPadding'),
                        ),
                      ),
                    ],
                    primary: true,
                    startSpacing: 16,
                    endSpacing: 12,
                  ),
                ),
              ),
              RichText(
                style: bodyMedium,
                maxLines: 1,
                spans: [
                  RichTextSpan(
                    'Don’t have an account? ',
                    fontSize: 17,
                    style: bodyMedium,
                    lineHeight: 1.29,
                  ),
                  RichTextSpan(
                    'Sign up',
                    color: primary,
                    fontSize: 17,
                    bold: true,
                    style: bodyMedium,
                    lineHeight: 1.29,
                  ),
                ],
                textAlign: TextAlign.center,
                fontSize: 17,
                lineHeight: 1.29,
                padding: EdgeInsets.only(top: 8, bottom: 16),
                outerAlignment: Alignment.center,
                onTap: () {
                  context.push(SignUpPage());
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
      width: double.infinity,
      height: double.infinity,
    ),
    backgroundColor: bgColor,
    safeArea: false,
  );
}
