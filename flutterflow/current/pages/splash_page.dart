@Page(route: '/', initial: true)
class SplashPage {
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
        actions.getPackageName(outputAs: 'packageName');
        appState.packageName = packageName;
        appState.isIntro = true;
        if (appState.isLogin == true) {
          context.push(HomeMainPage(), allowBack: false);
        } else {
          context.push(WelcomeScreenPage(), allowBack: false);
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
                    'Purrbi',
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
                    'Know what\'s in their bowl.',
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
