@Page(route: '/')
class DeleteAccountPage {
  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Stack(
            children: [
              Column(
                children: [
                  Container(
                    child: Icon(
                      IconData('deleteaccountyp', custom: true),
                      size: 42,
                      color: primary,
                    ),
                    color: primaryBackground,
                    width: 99,
                    alignment: Alignment.center,
                    boxShape: BoxShape.circle,
                  ),
                  Text(
                    'Your account has been deleted!',
                    style: bodyMedium,
                    textAlign: TextAlign.center,
                    lineHeight: 1.3,
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    padding: EdgeInsets.only(top: 16, bottom: 9),
                  ),
                  Text(
                    'Your data has been permanently removed, We’re sorry to see you go.',
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
                      bottom: 16,
                    ),
                  ),
                  Button(
                    'Done ',
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
                      context.push(SignInPage(), allowBack: false);
                    },
                  ),
                  Button(
                    'Create new account',
                    variant: ButtonVariant.outlined,
                    width: double.infinity,
                    height: 56,
                    borderRadius: 16,
                    style: titleSmall,
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    lineHeight: 1,
                    innerPadding: EdgeInsets.only(left: 20, right: 20),
                    padding: EdgeInsets.only(top: 16),
                    onTap: () {
                      context.push(SignUpPage(), allowBack: false);
                    },
                  ),
                ],
                scrollable: true,
                startSpacing: 24,
                endSpacing: 24,
                padding: EdgeInsets.only(left: 58, right: 58),
                outerAlignment: Alignment.center,
              ),
              Row(
                children: [
                  Container(
                    child: Icon(
                      IconData('arrowbackyp', custom: true),
                      color: primaryText,
                    ),
                    color: buttonBg,
                    borderColor: borderColor,
                    borderWidth: 1,
                    width: 40,
                    alignment: Alignment.center,
                    boxShape: BoxShape.circle,
                    onTap: () {
                      context.push(WelcomeScreenPage(), allowBack: false);
                    },
                  ),
                ],
                crossAxis: CrossAxis.start,
                spacing: 8,
                minSize: MainAxisSize.min,
                padding: EdgeInsets.only(
                  left: Constant('mainPadding'),
                  top: 11,
                  right: Constant('mainPadding'),
                  bottom: 12,
                ),
              ),
            ],
            alignment: Alignment.topLeft,
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
    disableAndroidBackButton: true,
  );
}
