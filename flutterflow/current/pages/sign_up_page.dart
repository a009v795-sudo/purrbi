@Page(route: '/')
class SignUpPage {
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
                    width: 70,
                    height: 70,
                    alignment: Alignment.center,
                  ),
                  Text(
                    'Create account',
                    style: bodyMedium,
                    textAlign: TextAlign.start,
                    lineHeight: 1.21,
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                    padding: EdgeInsets.only(top: 16, bottom: 8),
                  ),
                  Text(
                    'Create your account and continue anytime, anywhere.',
                    style: bodyMedium,
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
                        'First name',
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
                        hint: 'Enter first name',
                        maxLines: 1,
                        initialText: appState.userDetail.firstName,
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
                        capitalization: Capitalization.sentences,
                        submitType: SubmitType.next,
                        width: double.infinity,
                        setStateOnChanged: true,
                        debounceTime: 100,
                        required: true,
                        requiredMessage: 'Please enter first name',
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          top: 8,
                          right: Constant('mainPadding'),
                          bottom: 16,
                        ),
                      ),
                      Text(
                        'Last name',
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
                        hint: 'Enter last name',
                        maxLines: 1,
                        initialText: appState.userDetail.lastName,
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
                        capitalization: Capitalization.sentences,
                        submitType: SubmitType.next,
                        width: double.infinity,
                        setStateOnChanged: true,
                        debounceTime: 100,
                        required: true,
                        requiredMessage: 'Please enter last name',
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          top: 8,
                          right: Constant('mainPadding'),
                          bottom: 16,
                        ),
                      ),
                      Text(
                        'Username',
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
                        hint: 'Enter username',
                        maxLines: 1,
                        initialText: appState.userDetail.userName,
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
                        required: true,
                        requiredMessage: 'Please enter username',
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          top: 8,
                          right: Constant('mainPadding'),
                          bottom: 16,
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
                        required: true,
                        requiredMessage: 'Please enter password',
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          top: 8,
                          right: Constant('mainPadding'),
                          bottom: 12,
                        ),
                      ),
                      Row(
                        children: [
                          Container(
                            padding: EdgeInsets.all(4),
                            child: ConditionalBuilder(
                              children: [
                                PlaceholderWidget(
                                  children: [
                                    Container(
                                      child: Icon(
                                        'done_rounded',
                                        size: 12,
                                        color: Color(0xFFFFFFFF),
                                      ),
                                      color: primary,
                                      borderRadius: 4,
                                      width: 16,
                                      height: 16,
                                      alignment: Alignment.center,
                                    ),
                                  ],
                                  visible: isCheck,
                                ),
                                PlaceholderWidget(
                                  children: [
                                    Container(
                                      borderRadius: 4,
                                      borderColor: borderColor,
                                      width: 16,
                                      height: 16,
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            onTap: () {
                              isCheck.toggle();
                            },
                          ),
                          Expanded(
                            RichText(
                              style: bodyMedium,
                              spans: [
                                RichTextSpan(
                                  'I agree to the ',
                                  fontSize: 15,
                                  style: bodyMedium,
                                  lineHeight: 1.33,
                                ),
                                RichTextSpan(
                                  'terms and conditions',
                                  color: primary,
                                  fontSize: 15,
                                  style: bodyMedium,
                                  lineHeight: 1.33,
                                  onTap: () {
                                    context.push(TermsConditionPage());
                                  },
                                ),
                              ],
                              textAlign: TextAlign.start,
                            ),
                          ),
                        ],
                        spacing: 4,
                        padding: EdgeInsets.only(
                          left: 12,
                          right: Constant('mainPadding'),
                          bottom: 30,
                        ),
                      ),
                      Button(
                        'Sign up',
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
                            ValidateForm('Form_3gfarhqj');
                            if (isCheck) {
                              Wait(1000);
                              SetState.batch([
                                appState.isLogin = true,
                                appState.userDetail
                                  ..firstName =
                                      WidgetState('TextField_fkl9bier').text
                                  ..lastName =
                                      WidgetState('TextField_dqjk0ngn').text
                                  ..email =
                                      WidgetState('TextField_n7eytbwg').text
                                  ..password =
                                      WidgetState('TextField_z5rhix2u').text
                                  ..userName =
                                      WidgetState('TextField_ogujwbzh').text,
                              ]);
                              context.push(
                                VerificationsPage(
                                  email: WidgetState('TextField_n7eytbwg').text,
                                ),
                              );
                            } else {
                              mainSanckbar(
                                title:
                                    'Please agree to the terms and conditions',
                                shouldSetState: true,
                              );
                            }
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
                                    overflow: TextOverflow.ellipsis,
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
                                    overflow: TextOverflow.ellipsis,
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
                    'Already have an account? ',
                    fontSize: 17,
                    style: bodyMedium,
                    lineHeight: 1.29,
                  ),
                  RichTextSpan(
                    'Sign in',
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
                  context.safePop();
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
