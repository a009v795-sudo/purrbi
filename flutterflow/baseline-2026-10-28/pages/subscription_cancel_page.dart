@Page(route: '/')
class SubscriptionCancelPage {
  bool isCheck = true;
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
                      IconData('proresulttips', custom: true),
                      size: 42,
                      color: primary,
                    ),
                    color: secondary,
                    width: 99,
                    alignment: Alignment.center,
                    boxShape: BoxShape.circle,
                  ),
                  Text(
                    'Subscription has been cancelled!',
                    style: bodyMedium,
                    textAlign: TextAlign.center,
                    lineHeight: 1.3,
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    padding: EdgeInsets.only(top: 16, bottom: 8),
                  ),
                  Text(
                    'Your Monthly Premium plan has been cancelled you\'ll retain access until Mar 31, 2026.',
                    style: bodyMedium,
                    color: secondaryText,
                    textAlign: TextAlign.center,
                    lineHeight: 1.46,
                    fontSize: 15,
                    fontWeight: FontWeight.w400,
                    padding: EdgeInsets.only(bottom: 12),
                  ),
                  Container(
                    padding: EdgeInsets.only(left: 16, top: 15, right: 16),
                    child: Column(
                      children: [
                        Text(
                          'Change your mind?',
                          style: bodyMedium,
                          color: primary,
                          textAlign: TextAlign.center,
                          lineHeight: 1.3,
                          fontSize: 20,
                          fontWeight: FontWeight.w600,
                        ),
                        Text(
                          'Keep enjoying unlimited barcode scans and all premium features.',
                          style: bodyMedium,
                          textAlign: TextAlign.center,
                          lineHeight: 1.46,
                          fontSize: 15,
                          fontWeight: FontWeight.w500,
                          padding: EdgeInsets.only(top: 7, bottom: 12),
                        ),
                      ],
                    ),
                    color: primaryLightColor,
                    borderRadius: 16,
                    borderColor: borderColor,
                    borderWidth: 1,
                    width: double.infinity,
                  ),
                  Button(
                    'Renew subscription',
                    width: double.infinity,
                    height: 56,
                    borderRadius: 16,
                    style: titleSmall,
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    lineHeight: 1,
                    elevation: 0,
                    innerPadding: EdgeInsets.only(left: 20, right: 20),
                    padding: EdgeInsets.only(left: 27, top: 20, right: 27),
                    outerAlignment: Alignment(2.967, 0.605),
                    onTap: () {
                      if (appState.connected) {
                        context.push(PremiumPage());
                      } else {
                        internetSnackbar(shouldSetState: true);
                      }
                    },
                  ),
                ],
                mainAxis: MainAxis.center,
                scrollable: true,
                startSpacing: 24,
                endSpacing: 24,
                padding: EdgeInsets.only(left: 37, right: 37),
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
                      context.push(HomeMainPage(), allowBack: false);
                    },
                  ),
                ],
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
