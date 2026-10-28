@Page(route: '/')
class ResetPasswordPage {
  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Column(
            children: [
              MainAppbar(
                title: 'New password',
                isBack: false,
                isEdit: false,
                isShare: false,
              ),
              Expanded(
                Form(
                  child: ListView(
                    children: [
                      Text(
                        'Please create a new password, different from your old passwords',
                        style: bodyMedium,
                        textAlign: TextAlign.start,
                        lineHeight: 1.52,
                        fontSize: 17,
                        fontWeight: FontWeight.w400,
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          right: Constant('mainPadding'),
                          bottom: 24,
                        ),
                      ),
                      Text(
                        'New password',
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
                        hint: 'Enter new password',
                        suffixIconColor: primaryText,
                        suffixIconSize: 24,
                        keyboard: Keyboard.visiblePassword,
                        obscureText: true,
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
                        requiredMessage: 'Please enter new password',
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          top: 8,
                          right: Constant('mainPadding'),
                        ),
                      ),
                      Text(
                        'Confirm password',
                        style: bodyMedium,
                        textAlign: TextAlign.start,
                        lineHeight: 1.46,
                        fontSize: 15,
                        fontWeight: FontWeight.w400,
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          top: 16,
                          right: Constant('mainPadding'),
                        ),
                      ),
                      TextField(
                        hint: 'Enter confirm password',
                        suffixIconColor: primaryText,
                        suffixIconSize: 24,
                        keyboard: Keyboard.visiblePassword,
                        obscureText: true,
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
                        requiredMessage: 'Please enter confirm password',
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          top: 8,
                          right: Constant('mainPadding'),
                          bottom: 30,
                        ),
                      ),
                      Button(
                        'Reset password',
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
                            ValidateForm('Form_3ri12sew');
                            if ((WidgetState('TextField_k1s6s3yo').text) ==
                                (WidgetState('TextField_gwavjjc5').text)) {
                              Wait(1000);
                              ShowBottomSheet(
                                PasswordResetDialog(
                                  onTapOk: () {
                                    DismissBottomSheet();
                                    context.safePop();
                                    context.safePop();
                                    context.safePop();
                                  },
                                ),
                                backgroundColor: Color(0x00000000),
                                enableDrag: false,
                              );
                            } else {
                              mainSanckbar(
                                title: 'Please enter same password',
                                shouldSetState: true,
                              );
                            }
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
