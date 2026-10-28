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
                      'Draft, 28 October 2026 · not yet legally reviewed',
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
                                'Educational information only',
                                style: bodyMedium,
                                textAlign: TextAlign.start,
                                lineHeight: 1.33,
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                              ),
                              Text(
                                'Purrbi provides educational information about cat and dog products. It is not veterinary advice and cannot tell whether a product is right for a particular animal or a diagnosed condition. Ask your veterinarian before changing your pet\'s diet.',
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
                                'Accuracy and limits',
                                style: bodyMedium,
                                textAlign: TextAlign.start,
                                lineHeight: 1.33,
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                              ),
                              Text(
                                'Product information comes from public databases, manufacturer labels and your photos, and can be incomplete or out of date. Label text read from photos by AI can contain errors. FDA recall data is updated weekly and does not cover every notice, so also check the package and the FDA website.',
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
                                'Your account',
                                style: bodyMedium,
                                textAlign: TextAlign.start,
                                lineHeight: 1.33,
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                              ),
                              Text(
                                'Keep your sign-in details private and add only photos of product packaging. You can delete your scans and your account at any time in the app.',
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
