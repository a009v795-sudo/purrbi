@Page(route: '/')
class PrivacyPolicyPage {
  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Column(
            children: [
              MainAppbar(
                title: 'Privacy policy',
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
                                'What information do we collect?',
                                style: bodyMedium,
                                textAlign: TextAlign.start,
                                lineHeight: 1.3,
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                              ),
                              Text(
                                'AI Animal Barcode Identifier may collect your name, email, account details, barcode photos you scan or upload, scan history, device information, and app usage data. This helps us identify product tracks, improve AI accuracy, and deliver a better experience.',
                                style: bodyMedium,
                                textAlign: TextAlign.start,
                                lineHeight: 1.52,
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
                                'How is your information used?',
                                style: bodyMedium,
                                textAlign: TextAlign.start,
                                lineHeight: 1.33,
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                              ),
                              Text(
                                'We use your information to process barcode identifications, save scan history, personalize product insights, improve our AI models, provide customer support, and enhance app features. Aggregated or anonymous usage data may also be used for analytics and service improvements.',
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
                                'How do we protect and share data?',
                                style: bodyMedium,
                                textAlign: TextAlign.start,
                                lineHeight: 1.3,
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                              ),
                              Text(
                                'We use industry-standard safeguards—including encryption and secure storage—to help protect your personal information and uploaded barcode images. We do not sell your personal data. You may request access, correction, or deletion of your information by contacting us through the app.',
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
