@Page(route: '/')
class WelcomeScreenPage {
  bool isCheck = true;
  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Column(
            children: [
              Expanded(
                Column(
                  children: [
                    Container(
                      child: MiniLogo(hight: 75.0, width: 75.0),
                      color: primaryBackground,
                      borderRadius: 20,
                      borderColor: Color(0x00000000),
                      width: 120,
                      height: 120,
                      alignment: Alignment.center,
                    ),
                    Text(
                      'AI barcode identifier',
                      style: bodyMedium,
                      color: primaryText,
                      maxLines: 1,
                      textAlign: TextAlign.center,
                      lineHeight: 1.21,
                      fontSize: 28,
                      fontWeight: FontWeight.w700,
                      autoSize: true,
                      padding: EdgeInsets.only(
                        left: Constant('mainPadding'),
                        top: 16,
                        right: Constant('mainPadding'),
                        bottom: 8,
                      ),
                    ),
                    Text(
                      'Create an account to save your progress and personalize your experience',
                      style: bodyMedium,
                      color: secondaryText,
                      maxLines: 2,
                      textAlign: TextAlign.center,
                      lineHeight: 1.46,
                      fontSize: 15,
                      fontWeight: FontWeight.w400,
                      autoSize: true,
                      padding: EdgeInsets.only(
                        left: Constant('mainPadding'),
                        right: Constant('mainPadding'),
                        bottom: 35,
                      ),
                    ),
                    Button(
                      'Create account',
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
                        context.push(SignUpPage());
                      },
                    ),
                    Button(
                      'Sign in',
                      variant: ButtonVariant.outlined,
                      width: double.infinity,
                      height: 56,
                      borderRadius: 16,
                      style: titleSmall,
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      lineHeight: 1,
                      innerPadding: EdgeInsets.only(left: 20, right: 20),
                      padding: EdgeInsets.only(
                        left: Constant('mainPadding'),
                        top: 16,
                        right: Constant('mainPadding'),
                        bottom: 16,
                      ),
                      onTap: () {
                        context.push(SignInPage());
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
                          textAlign: TextAlign.center,
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
                  mainAxis: MainAxis.center,
                ),
              ),
              RichText(
                style: bodyMedium,
                spans: [
                  RichTextSpan(
                    'By continuing you agree to our ',
                    fontSize: 17,
                    style: bodyMedium,
                    lineHeight: 1.41,
                  ),
                  RichTextSpan(
                    'Terms & Condition',
                    color: primary,
                    fontSize: 17,
                    underline: true,
                    style: bodyMedium,
                    lineHeight: 1.41,
                  ),
                ],
                textAlign: TextAlign.center,
                fontSize: 17,
                lineHeight: 1.41,
                padding: EdgeInsets.only(
                  left: Constant('mainPadding'),
                  top: 4,
                  right: Constant('mainPadding'),
                  bottom: 24,
                ),
              ),
            ],
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
