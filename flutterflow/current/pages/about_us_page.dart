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
                                'What Purrbi does',
                                style: bodyMedium,
                                textAlign: TextAlign.start,
                                lineHeight: 1.3,
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                              ),
                              Text(
                                'Purrbi helps cat and dog owners understand foods, treats, toppers and supplements. Scan a barcode to see label facts, ingredients, FDA recall records and how the product fits your pet\'s profile. If information is missing, Purrbi asks for a photo of the label.',
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
                                'Where the information comes from',
                                style: bodyMedium,
                                textAlign: TextAlign.start,
                                lineHeight: 1.3,
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                              ),
                              Text(
                                'Product records come from Open Pet Food Facts, a community database (Open Database License), from manufacturer label information when Purrbi can verify it, from FDA enforcement reports (openFDA) and from label photos you choose to add. Each finding shows its source.',
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
                                'What the score means',
                                style: bodyMedium,
                                textAlign: TextAlign.start,
                                lineHeight: 1.3,
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                              ),
                              Text(
                                'The Purrbi label score is Purrbi\'s own assessment of how completely the label documents the product\'s intended use, minus documented species-specific ingredient concerns. It is not an FDA, AAFCO, WSAVA or veterinary rating and does not certify safety. Purrbi gives educational information, not veterinary advice.',
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
