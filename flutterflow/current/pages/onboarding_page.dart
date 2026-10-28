@Page(route: '/')
class OnboardingPage {
  int pageViewIndex = 0;
  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Stack(
            children: [
              PageView(
                children: [
                  Column(
                    children: [
                      Expanded(
                        Image(
                          (globalProperties.isLightMode
                                  ? (ItemRef().image)
                                  : (ItemRef().darkImage)) ??
                              'https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/dboi154xv6s0/intro-light-1.png',
                          fit: ImageFit.contain,
                          width: double.infinity,
                          height: double.infinity,
                          borderRadius: 0,
                          cacheFadeDuration: 200,
                          showErrorImage: true,
                          padding: EdgeInsets.only(
                            left: 16,
                            top: 84,
                            right: 16,
                            bottom: 52,
                          ),
                          animations: [
                            WidgetAnimation(
                              effects: [
                                ScaleEffect(
                                  beginDx: 1.05,
                                  endDx: 1.0,
                                  beginDy: 1.05,
                                  endDy: 1,
                                  delayMs: 50.0,
                                  durationMs: 400.0,
                                ),
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
                      ),
                      RichText(
                        style: bodyMedium,
                        maxLines: 3,
                        spans: [
                          RichTextSpan(
                            ItemRef().title,
                            color: primaryText,
                            fontSize: 28,
                            style: bodyMedium,
                            fontWeight: FontWeight.w700,
                            lineHeight: 1.21,
                          ),
                        ],
                        textAlign: TextAlign.start,
                        color: primaryText,
                        fontSize: 28,
                        fontWeight: FontWeight.w700,
                        lineHeight: 1.21,
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          right: Constant('mainPadding'),
                        ),
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
                      Text(
                        ItemRef().subTitle,
                        style: bodyMedium,
                        color: secondaryText,
                        maxLines: 2,
                        textAlign: TextAlign.start,
                        overflow: TextOverflow.ellipsis,
                        lineHeight: 1.52,
                        fontSize: 17,
                        fontWeight: FontWeight.w400,
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          top: 12,
                          right: Constant('mainPadding'),
                        ),
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
                    ],
                    mainAxis: MainAxis.end,
                    crossAxis: CrossAxis.start,
                    padding: EdgeInsets.only(bottom: 154),
                  ),
                ],
                height: double.infinity,
                onWidgetSwipe: (value) {
                  pageViewIndex = value;
                },
              ),
              Row(
                children: [
                  Expanded(
                    Button(
                      'Skip',
                      variant: ButtonVariant.outlined,
                      height: 56,
                      borderRadius: 999,
                      style: titleSmall,
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      lineHeight: 1,
                      innerPadding: EdgeInsets.only(left: 20, right: 20),
                      visible:
                          pageViewIndex != ((Count(appState.introList)) - 1),
                      onTap: () {
                        appState.isIntro = true;
                        context.push(PhotoTipsPage(), allowBack: false);
                      },
                    ),
                  ),
                  Expanded(
                    Button(
                      ((WidgetState('PageView_u1bacbu7').currentIndex) ==
                              ((Count(appState.introList)) - 1))
                          ? 'Get started'
                          : 'Next',
                      height: 56,
                      borderRadius: 999,
                      style: titleSmall,
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      lineHeight: 1,
                      elevation: 0,
                      innerPadding: EdgeInsets.only(left: 20, right: 20),
                      onTap: () {
                        if (pageViewIndex ==
                            ((Count(appState.introList)) - 1)) {
                          appState.isIntro = true;
                          context.push(PhotoTipsPage(), allowBack: false);
                        } else {
                          PageViewControl.next('PageView_u1bacbu7');
                        }
                      },
                    ),
                  ),
                ],
                crossAxis: CrossAxis.end,
                spacing: 16,
                startSpacing: 16,
                endSpacing: 16,
                padding: EdgeInsets.only(bottom: 24),
              ),
              Container(
                padding: EdgeInsets.all(10),
                child: Row(
                  children: [
                    Container(
                      color: primary,
                      borderRadius: 999,
                      width: 20,
                      height: 6,
                      opacity:
                          ((ItemRef().index) ==
                                  (WidgetState(
                                    'PageView_u1bacbu7',
                                  ).currentIndex))
                              ? 1
                              : 0.3,
                    ),
                  ],
                  spacing: 8,
                  scrollable: true,
                ),
                borderRadius: 999,
                borderColor: borderColor,
                borderWidth: 1,
                margin: EdgeInsets.only(
                  left: spacing.md,
                  right: spacing.md,
                  bottom: 104,
                ),
              ),
            ],
            width: double.infinity,
            height: double.infinity,
            alignment: Alignment.bottomLeft,
          ),
          width: double.infinity,
          height: double.infinity,
          maxWidth: Constant('maxWidth'),
        ),
        gradient: Gradient.linear([
          GradientStop(linearColor1, 0),
          GradientStop(linearColor2, 0.13),
          GradientStop(linearColor3, 1),
        ], angle: 0),
      ),
      width: double.infinity,
      height: double.infinity,
      alignment: Alignment.topCenter,
    ),
    backgroundColor: bgColor,
    safeArea: false,
  );
}
