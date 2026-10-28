@Page(route: '/')
class PaymentFailedPage {
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
                      child: Icon(
                        IconData('closebigyp', custom: true),
                        size: 42,
                        color: primary,
                      ),
                      color: primaryLightColor,
                      width: 99,
                      alignment: Alignment.center,
                      boxShape: BoxShape.circle,
                    ),
                    Text(
                      'Payment Failed!',
                      style: bodyMedium,
                      textAlign: TextAlign.center,
                      lineHeight: 1.3,
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                      padding: EdgeInsets.only(
                        left: Constant('mainPadding'),
                        top: 16,
                        right: Constant('mainPadding'),
                        bottom: 8,
                      ),
                    ),
                    Text(
                      'We couldn’t complete your purchase. Please try again or use a different payment method.',
                      style: bodyMedium,
                      color: secondaryText,
                      textAlign: TextAlign.center,
                      lineHeight: 1.46,
                      fontSize: 15,
                      fontWeight: FontWeight.w400,
                      padding: EdgeInsets.only(
                        left: Constant('mainPadding'),
                        right: Constant('mainPadding'),
                        bottom: 20,
                      ),
                    ),
                    Button(
                      'Try Again',
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
                    ),
                    Button(
                      'Change Payment Method',
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
                    ),
                    Text(
                      'Back to Plans',
                      style: bodyMedium,
                      color: secondaryText,
                      textAlign: TextAlign.center,
                      lineHeight: 1.52,
                      fontSize: 17,
                      fontWeight: FontWeight.w500,
                    ),
                  ],
                  mainAxis: MainAxis.center,
                ),
              ),
              RichText(
                style: bodyMedium,
                spans: [
                  RichTextSpan(
                    'Need help? ',
                    color: primary,
                    fontSize: 15,
                    bold: true,
                    style: bodyMedium,
                    lineHeight: 1.33,
                  ),
                  RichTextSpan(
                    'Contact support for assistance.',
                    color: secondaryText,
                    fontSize: 15,
                    style: bodyMedium,
                    lineHeight: 1.33,
                  ),
                ],
                textAlign: TextAlign.center,
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
