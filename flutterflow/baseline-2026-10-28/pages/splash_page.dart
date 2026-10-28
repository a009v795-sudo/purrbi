@Page(route: '/', initial: true)
class SplashPage {
  double indicatorIndex = 0.0;
  onLoad() {
    if (appState.modeIndex == 0) {
      SetDarkMode(DarkModePreference.light);
    } else {
      if (appState.modeIndex == 1) {
        SetDarkMode(DarkModePreference.dark);
      } else {
        SetDarkMode(DarkModePreference.system);
      }
    }
    while (constants.true_) {
      if (appState.connected) {
        Wait(1000);
        indicatorIndex += 0.25;
        Wait(1000);
        indicatorIndex += 0.25;
        Parallel([
          () {
            actions.getCountryCodeLocal();
          },
          () {
            actions.getCurrencySymbol(
              currencyCode: 'USD',
              outputAs: 'currencyAdd',
            );
          },
          () {
            actions.getPackageName(outputAs: 'packageName');
          },
        ]);
        SetState.batch([
          appState.currencyType = currencyAdd,
          appState.packageName = packageName,
        ]);
        Wait(1000);
        indicatorIndex += 0.25;
        Wait(1000);
        indicatorIndex += 0.25;
        if (appState.isIntro == true) {
          if (appState.isLogin == true) {
            if (appState.isPro) {
              context.push(HomeMainPage(), allowBack: false);
            } else {
              context.push(PremiumPage(isEmpty: false), allowBack: false);
            }
          } else {
            context.push(WelcomeScreenPage(), allowBack: false);
          }
        } else {
          context.push(OnboardingPage(), allowBack: false);
        }
        break;
      } else {
        Wait(2000);
        internetSnackbar(shouldSetState: true);
      }
    }
  }

  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Stack(
            children: [
              Column(
                children: [
                  Container(
                    child: MiniLogo(hight: 131.0, width: 131.0),
                    width: 131,
                    boxShape: BoxShape.circle,
                    animations: [
                      WidgetAnimation(
                        effects: [
                          ScaleEffect(
                            beginDx: 1.1,
                            endDx: 1,
                            beginDy: 1.1,
                            endDy: 1,
                            delayMs: 50.0,
                            durationMs: 1000.0,
                          ),
                        ],
                        applyInitialState: true,
                      ),
                    ],
                  ),
                  Text(
                    'AI-powered barcode identifier App',
                    style: bodyMedium,
                    color: primaryText,
                    textAlign: TextAlign.center,
                    lineHeight: 1.21,
                    fontSize: 24,
                    fontWeight: FontWeight.w600,
                    animations: [
                      WidgetAnimation(
                        effects: [
                          SlideEffect(
                            beginDx: 0,
                            beginDy: 30.0,
                            endDx: 0,
                            endDy: 0,
                            delayMs: 0,
                            durationMs: 600.0,
                          ),
                        ],
                        applyInitialState: true,
                      ),
                    ],
                  ),
                  Text(
                    'Scan & identify barcodes',
                    style: bodyMedium,
                    color: secondaryText,
                    textAlign: TextAlign.center,
                    lineHeight: 1.52,
                    fontSize: 17,
                    fontWeight: FontWeight.w400,
                    animations: [
                      WidgetAnimation(
                        effects: [
                          SlideEffect(
                            beginDx: 0,
                            beginDy: 30.0,
                            endDx: 0,
                            endDy: 0,
                            delayMs: 0.0,
                            durationMs: 600.0,
                          ),
                        ],
                        applyInitialState: true,
                      ),
                    ],
                  ),
                ],
                mainAxis: MainAxis.center,
                spacing: 12,
                minSize: MainAxisSize.min,
                padding: EdgeInsets.only(left: 16, right: 16),
                outerAlignment: Alignment.center,
              ),
              Column(
                children: [
                  RichText(
                    style: bodyMedium,
                    spans: [
                      RichTextSpan(
                        'Preparing your AI scanner...',
                        color: secondaryText,
                        fontSize: 13,
                        style: bodyMedium,
                        lineHeight: 1.31,
                      ),
                      RichTextSpan(
                        '${indicatorIndex * 100}%',
                        color: primary,
                        fontSize: 13,
                        style: bodyMedium,
                        fontWeight: FontWeight.w500,
                        lineHeight: 1.31,
                      ),
                    ],
                  ),
                  Container(
                    child: ProgressBar.linear(
                      thickness: 8,
                      value: indicatorIndex,
                      animation: true,
                      progressColor: primary,
                      backgroundColor: primaryLightColor,
                      barRadius: 16,
                    ),
                    maxWidth: 270,
                  ),
                ],
                mainAxis: MainAxis.end,
                spacing: 16,
                minSize: MainAxisSize.min,
                padding: EdgeInsets.only(bottom: 26),
                outerAlignment: Alignment.bottomCenter,
              ),
            ],
            width: double.infinity,
            height: double.infinity,
            alignment: Alignment.topLeft,
          ),
          width: double.infinity,
          height: double.infinity,
        ),
        gradient: Gradient.linear([
          GradientStop(linearColor1, 0),
          GradientStop(linearColor2, 0.13),
          GradientStop(linearColor3, 1),
        ], angle: 0),
      ),
      width: double.infinity,
      height: double.infinity,
      maxWidth: Constant('maxWidth'),
      outerAlignment: Alignment.topCenter,
    ),
    backgroundColor: bgColor,
    safeArea: false,
  );
}
