@Page(route: '/')
class AboutUsPage {
  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Column(
            children: [
              MainAppbar(
                title: 'About us',
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
                                'What we do',
                                style: bodyMedium,
                                textAlign: TextAlign.start,
                                lineHeight: 1.3,
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                              ),
                              Text(
                                'AI Animal Barcode Identifier helps you recognize product tracks from photos using advanced AI. Scan or upload a barcode to get fast, accurate barcode scan—plus clear details about the animal behind the print.',
                                style: bodyMedium,
                                textAlign: TextAlign.start,
                                lineHeight: 1.259,
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
                                'Who it\'s for',
                                style: bodyMedium,
                                textAlign: TextAlign.start,
                                lineHeight: 1.3,
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                              ),
                              Text(
                                'Made for hikers, product enthusiasts, researchers, photographers, students, forest professionals, and anyone curious about nature. On the trail or in the field, identify barcodes with confidence.',
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
                                'Why choose us',
                                style: bodyMedium,
                                textAlign: TextAlign.start,
                                lineHeight: 1.3,
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                              ),
                              Text(
                                'We combine advanced AI with a rich product knowledge base for reliable track identification. Get confidence scores, barcode analysis, habitat details, and behavior insights—all in one simple, nature-forward app.',
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
