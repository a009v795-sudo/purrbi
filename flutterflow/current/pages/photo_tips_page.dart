@Page(route: '/')
class PhotoTipsPage {
  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Column(
            children: [
              MainAppbar(
                title: 'Photo tips',
                isBack: true,
                isEdit: false,
                isShare: false,
                backAction: () {
                  SetState.batch([
                    appState.homePageIndex = 0,
                    appState.isPro = false,
                    appState.isIntro = true,
                  ]);
                  context.push(WelcomeScreenPage(), allowBack: false);
                },
              ),
              Expanded(
                ListView(
                  children: [
                    RichText(
                      style: bodyMedium,
                      spans: [
                        RichTextSpan(
                          'Tips for better results',
                          fontSize: 24,
                          bold: true,
                          style: bodyMedium,
                          lineHeight: 1.21,
                        ),
                        RichTextSpan(
                          null,
                          color: primary,
                          fontSize: 24,
                          bold: true,
                          style: bodyMedium,
                          lineHeight: 1.21,
                        ),
                      ],
                      textAlign: TextAlign.start,
                      fontSize: 24,
                      fontWeight: FontWeight.w600,
                      lineHeight: 1.21,
                      padding: EdgeInsets.only(
                        left: Constant('mainPadding'),
                        right: Constant('mainPadding'),
                      ),
                      outerAlignment: Alignment.center,
                      animations: [
                        WidgetAnimation(
                          effects: [
                            SlideEffect(
                              beginDx: -40.0,
                              beginDy: 0,
                              endDx: 0,
                              endDy: 0,
                              delayMs: 200.0,
                              durationMs: 100.0,
                            ),
                            FadeEffect(
                              begin: 0,
                              end: 1,
                              delayMs: 200.0,
                              durationMs: 100.0,
                            ),
                          ],
                          applyInitialState: true,
                        ),
                      ],
                    ),
                    Text(
                      'Capture clear images and get reliable results in seconds.',
                      style: bodyMedium,
                      color: secondaryText,
                      textAlign: TextAlign.center,
                      lineHeight: 1.52,
                      fontSize: 17,
                      fontWeight: FontWeight.w400,
                      padding: EdgeInsets.only(
                        left: Constant('mainPadding'),
                        top: 8,
                        right: Constant('mainPadding'),
                        bottom: 16,
                      ),
                    ),
                    Row(
                      children: [
                        Expanded(
                          Column(
                            children: [
                              Container(
                                color: buttonBg,
                                borderRadius: 24,
                                width: double.infinity,
                                height: 206,
                                alignment: Alignment.bottomLeft,
                                image: DecorationImage(
                                  path:
                                      'projects/a-i-barcode-identifier-app-ahbvz7/assets/3j9l1wplpvo8/photo-tips-2.png',
                                  type: ImageType.asset,
                                ),
                              ),
                              Text(
                                'Bright photo',
                                style: bodyMedium,
                                fontSize: 17,
                                fontWeight: FontWeight.w600,
                                padding: EdgeInsets.only(top: 6),
                              ),
                              Text(
                                'Clear and sharp',
                                style: bodyMedium,
                                color: secondaryText,
                              ),
                            ],
                            crossAxis: CrossAxis.start,
                          ),
                        ),
                        Expanded(
                          Column(
                            children: [
                              Container(
                                color: buttonBg,
                                borderRadius: 24,
                                width: double.infinity,
                                height: 206,
                                alignment: Alignment.bottomLeft,
                                image: DecorationImage(
                                  path:
                                      'projects/a-i-barcode-identifier-app-ahbvz7/assets/z1f819um3i13/photio-tips-1.png',
                                  type: ImageType.asset,
                                ),
                              ),
                              Text(
                                'Avoid ',
                                style: bodyMedium,
                                lineHeight: 1.53,
                                fontSize: 17,
                                fontWeight: FontWeight.w600,
                              ),
                              Text(
                                'Dark or blurry images',
                                style: bodyMedium,
                                color: secondaryText,
                                lineHeight: 1.43,
                              ),
                            ],
                            crossAxis: CrossAxis.start,
                          ),
                        ),
                      ],
                      mainAxis: MainAxis.spaceBetween,
                      crossAxis: CrossAxis.start,
                      spacing: 16,
                      padding: EdgeInsets.only(
                        left: Constant('mainPadding'),
                        right: Constant('mainPadding'),
                        bottom: 20,
                      ),
                      animations: [
                        WidgetAnimation(
                          effects: [
                            SlideEffect(
                              beginDx: -100.0,
                              beginDy: 0,
                              endDx: 0,
                              endDy: 0,
                              delayMs: 400.0,
                              durationMs: 100.0,
                            ),
                            FadeEffect(
                              begin: 0,
                              end: 1,
                              delayMs: 400.0,
                              durationMs: 100.0,
                            ),
                          ],
                          applyInitialState: true,
                        ),
                      ],
                    ),
                    Container(
                      padding: EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Container(
                            child: Icon(
                              'camera_alt_outlined',
                              size: 22,
                              color: primary,
                            ),
                            color: primaryLightColor,
                            width: 45,
                            alignment: Alignment.center,
                            boxShape: BoxShape.circle,
                          ),
                          Expanded(
                            Column(
                              children: [
                                Text(
                                  'Good lighting',
                                  style: bodyMedium,
                                  textAlign: TextAlign.start,
                                  lineHeight: 1.33,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w600,
                                ),
                                Text(
                                  'Use natural light for better visibility.',
                                  style: bodyMedium,
                                  color: secondaryText,
                                  textAlign: TextAlign.start,
                                  lineHeight: 1.47,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w400,
                                ),
                              ],
                              crossAxis: CrossAxis.start,
                              spacing: 2,
                            ),
                          ),
                        ],
                        crossAxis: CrossAxis.start,
                        spacing: 10,
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
                      animations: [
                        WidgetAnimation(
                          effects: [
                            SlideEffect(
                              beginDx: -100.0,
                              beginDy: 0,
                              endDx: 0,
                              endDy: 0,
                              delayMs: 500.0,
                              durationMs: 100.0,
                            ),
                            FadeEffect(
                              begin: 0,
                              end: 1,
                              delayMs: 500.0,
                              durationMs: 100.0,
                            ),
                          ],
                          applyInitialState: true,
                        ),
                      ],
                    ),
                    Container(
                      padding: EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Container(
                            child: Icon(
                              IconData('appearanceyp', custom: true),
                              size: 22,
                              color: primary,
                            ),
                            color: primaryLightColor,
                            width: 45,
                            alignment: Alignment.center,
                            boxShape: BoxShape.circle,
                          ),
                          Expanded(
                            Column(
                              children: [
                                Text(
                                  'Bright photo',
                                  style: bodyMedium,
                                  textAlign: TextAlign.start,
                                  lineHeight: 1.33,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w600,
                                ),
                                Text(
                                  'Ensure the image is sharp and detailed.',
                                  style: bodyMedium,
                                  color: secondaryText,
                                  textAlign: TextAlign.start,
                                  lineHeight: 1.47,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w400,
                                ),
                              ],
                              crossAxis: CrossAxis.start,
                              spacing: 2,
                            ),
                          ),
                        ],
                        crossAxis: CrossAxis.start,
                        spacing: 10,
                      ),
                      color: buttonBg,
                      borderRadius: 16,
                      borderColor: borderColor,
                      borderWidth: 1,
                      width: double.infinity,
                      margin: EdgeInsets.only(
                        left: Constant('mainPadding'),
                        top: 16,
                        right: Constant('mainPadding'),
                        bottom: 16,
                      ),
                      animations: [
                        WidgetAnimation(
                          effects: [
                            SlideEffect(
                              beginDx: -100.0,
                              beginDy: 0,
                              endDx: 0,
                              endDy: 0,
                              delayMs: 500.0,
                              durationMs: 100.0,
                            ),
                            FadeEffect(
                              begin: 0,
                              end: 1,
                              delayMs: 500.0,
                              durationMs: 100.0,
                            ),
                          ],
                          applyInitialState: true,
                        ),
                      ],
                    ),
                    Container(
                      padding: EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Container(
                            child: Icon(
                              'hd_outlined',
                              size: 22,
                              color: primary,
                            ),
                            color: primaryLightColor,
                            width: 45,
                            alignment: Alignment.center,
                            boxShape: BoxShape.circle,
                          ),
                          Expanded(
                            Column(
                              children: [
                                Text(
                                  'High resolution',
                                  style: bodyMedium,
                                  textAlign: TextAlign.start,
                                  lineHeight: 1.33,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w600,
                                ),
                                Text(
                                  'Ensure the image is clear and sharp.',
                                  style: bodyMedium,
                                  color: secondaryText,
                                  textAlign: TextAlign.start,
                                  lineHeight: 1.47,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w400,
                                ),
                              ],
                              crossAxis: CrossAxis.start,
                              spacing: 2,
                            ),
                          ),
                        ],
                        crossAxis: CrossAxis.start,
                        spacing: 10,
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
                      animations: [
                        WidgetAnimation(
                          effects: [
                            SlideEffect(
                              beginDx: -100.0,
                              beginDy: 0,
                              endDx: 0,
                              endDy: 0,
                              delayMs: 500.0,
                              durationMs: 100.0,
                            ),
                            FadeEffect(
                              begin: 0,
                              end: 1,
                              delayMs: 500.0,
                              durationMs: 100.0,
                            ),
                          ],
                          applyInitialState: true,
                        ),
                      ],
                    ),
                  ],
                  primary: true,
                  startSpacing: 16,
                  endSpacing: 12,
                ),
              ),
              Button(
                'Start identifier',
                icon: IconSpec(
                  IconData('wandstarsyp', custom: true),
                  size: 24,
                  color: Color(0xFFFFFFFF),
                ),
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
                  top: 12,
                  right: Constant('mainPadding'),
                  bottom: 16,
                ),
                onTap: () {
                  if (appState.connected) {
                    SetState.batch([
                      appState.homePageIndex = 0,
                      appState.isPro = false,
                      appState.isIntro = true,
                    ]);
                    Wait(1000);
                    context.push(WelcomeScreenPage(), allowBack: false);
                  } else {
                    internetSnackbar(shouldSetState: true);
                  }
                },
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
      width: double.infinity,
      height: double.infinity,
    ),
    backgroundColor: bgColor,
    safeArea: false,
    disableAndroidBackButton: true,
  );
}
