@Page(route: '/')
class TermsConditionPage {
  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Column(
            children: [
              MainAppbar(
                title: 'Terms & conditions',
                isBack: false,
                isEdit: false,
                isShare: false,
              ),
              Expanded(
                ListView(
                  children: [
                    Text(
                      'Last updated: March 2026',
                      style: bodyMedium,
                      color: secondaryText,
                      textAlign: TextAlign.start,
                      lineHeight: 1.33,
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                      padding: EdgeInsets.only(
                        left: Constant('mainPadding'),
                        right: Constant('mainPadding'),
                      ),
                    ),
                    Container(
                      padding: EdgeInsets.all(16),
                      child: Column(
                        children: [
                          Column(
                            children: [
                              Text(
                                'Acceptance of Terms',
                                style: bodyMedium,
                                textAlign: TextAlign.start,
                                lineHeight: 1.33,
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                              ),
                              Text(
                                'By downloading or using AI Animal Barcode Identifier, you agree to these Terms & Conditions. The app provides AI-powered barcode and barcode identification for educational and outdoor exploration purposes. If you do not agree, please discontinue use of the service.',
                                style: bodyMedium,
                                textAlign: TextAlign.start,
                                lineHeight: 1.29,
                                fontSize: 17,
                                fontWeight: FontWeight.w400,
                              ),
                            ],
                            crossAxis: CrossAxis.start,
                            spacing: 8,
                            animations: [
                              WidgetAnimation(
                                effects: [
                                  FadeEffect(
                                    begin: 0,
                                    end: 1,
                                    delayMs: 50.0,
                                    durationMs: 400.0,
                                  ),
                                ],
                                applyInitialState: true,
                              ),
                            ],
                          ),
                          Column(
                            children: [
                              Text(
                                'Use of Service & Your Account',
                                style: bodyMedium,
                                textAlign: TextAlign.start,
                                lineHeight: 1.33,
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                              ),
                              Text(
                                'You may scan and upload track photos for personal, non-commercial identification. Keep your account secure and submit only lawful images you have the right to use. Do not misuse the service or attempt unauthorized access. Subscriptions, if offered, renew per the terms shown at purchase. See our Privacy Policy for how we handle data.',
                                style: bodyMedium,
                                textAlign: TextAlign.start,
                                lineHeight: 1.29,
                                fontSize: 17,
                                fontWeight: FontWeight.w400,
                              ),
                            ],
                            crossAxis: CrossAxis.start,
                            spacing: 8,
                            animations: [
                              WidgetAnimation(
                                effects: [
                                  FadeEffect(
                                    begin: 0,
                                    end: 1,
                                    delayMs: 100.0,
                                    durationMs: 400.0,
                                  ),
                                ],
                                applyInitialState: true,
                              ),
                            ],
                          ),
                          Column(
                            children: [
                              Text(
                                'AI Identification Disclaimer',
                                style: bodyMedium,
                                textAlign: TextAlign.start,
                                lineHeight: 1.33,
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                              ),
                              Text(
                                'Species suggestions are generated by AI from your photos and product track reference data. Results depend on image quality and may be incomplete or incorrect—treat them as helpful guidance, not professional or scientific advice. We are not liable for decisions based on app results. Questions? Contact us via in-app support.',
                                style: bodyMedium,
                                textAlign: TextAlign.start,
                                lineHeight: 1.29,
                                fontSize: 17,
                                fontWeight: FontWeight.w400,
                              ),
                            ],
                            crossAxis: CrossAxis.start,
                            spacing: 8,
                            animations: [
                              WidgetAnimation(
                                effects: [
                                  FadeEffect(
                                    begin: 0,
                                    end: 1,
                                    delayMs: 150.0,
                                    durationMs: 400.0,
                                  ),
                                ],
                                applyInitialState: true,
                              ),
                            ],
                          ),
                        ],
                        crossAxis: CrossAxis.start,
                        spacing: 16,
                      ),
                      color: buttonBg,
                      borderRadius: 16,
                      borderColor: borderColor,
                      borderWidth: 1,
                      width: double.infinity,
                      margin: EdgeInsets.only(
                        left: Constant('mainPadding'),
                        right: Constant('mainPadding'),
                      ),
                    ),
                  ],
                  spacing: 8,
                  primary: true,
                  startSpacing: 16,
                  endSpacing: 12,
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
