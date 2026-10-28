@Page(route: '/')
class MyProfilePage {
  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Column(
            children: [
              MainAppbar(
                title: 'My profile',
                isBack: false,
                isEdit: true,
                isShare: false,
                editAction: () {
                  context.push(EditProfilePage());
                },
              ),
              Expanded(
                ListView(
                  children: [
                    Container(
                      padding: EdgeInsets.all(16),
                      child: Column(
                        children: [
                          Text(
                            'First name',
                            style: bodyMedium,
                            color: secondaryText,
                            textAlign: TextAlign.start,
                            lineHeight: 1.46,
                            fontSize: 15,
                            fontWeight: FontWeight.w400,
                          ),
                          Text(
                            appState.userDetail.firstName,
                            style: bodyMedium,
                            textAlign: TextAlign.start,
                            lineHeight: 1.52,
                            fontSize: 17,
                            fontWeight: FontWeight.w400,
                          ),
                        ],
                        crossAxis: CrossAxis.start,
                        spacing: 5,
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
                              delayMs: 50.0,
                              durationMs: 100.0,
                            ),
                            FadeEffect(
                              begin: 0,
                              end: 1,
                              delayMs: 50.0,
                              durationMs: 100.0,
                            ),
                          ],
                          applyInitialState: true,
                        ),
                      ],
                    ),
                    Container(
                      padding: EdgeInsets.all(16),
                      child: Column(
                        children: [
                          Text(
                            'Last name',
                            style: bodyMedium,
                            color: secondaryText,
                            textAlign: TextAlign.start,
                            lineHeight: 1.46,
                            fontSize: 15,
                            fontWeight: FontWeight.w400,
                          ),
                          Text(
                            appState.userDetail.lastName,
                            style: bodyMedium,
                            textAlign: TextAlign.start,
                            lineHeight: 1.52,
                            fontSize: 17,
                            fontWeight: FontWeight.w400,
                          ),
                        ],
                        crossAxis: CrossAxis.start,
                        spacing: 5,
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
                              delayMs: 100.0,
                              durationMs: 100.0,
                            ),
                            FadeEffect(
                              begin: 0,
                              end: 1,
                              delayMs: 100.0,
                              durationMs: 100.0,
                            ),
                          ],
                          applyInitialState: true,
                        ),
                      ],
                    ),
                    Container(
                      padding: EdgeInsets.all(16),
                      child: Column(
                        children: [
                          Text(
                            'Username',
                            style: bodyMedium,
                            color: secondaryText,
                            textAlign: TextAlign.start,
                            lineHeight: 1.46,
                            fontSize: 15,
                            fontWeight: FontWeight.w400,
                          ),
                          Text(
                            appState.userDetail.userName,
                            style: bodyMedium,
                            textAlign: TextAlign.start,
                            lineHeight: 1.52,
                            fontSize: 17,
                            fontWeight: FontWeight.w400,
                          ),
                        ],
                        crossAxis: CrossAxis.start,
                        spacing: 5,
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
                              delayMs: 150.0,
                              durationMs: 100.0,
                            ),
                            FadeEffect(
                              begin: 0,
                              end: 1,
                              delayMs: 150.0,
                              durationMs: 100.0,
                            ),
                          ],
                          applyInitialState: true,
                        ),
                      ],
                    ),
                    Container(
                      padding: EdgeInsets.all(16),
                      child: Column(
                        children: [
                          Text(
                            'Email address',
                            style: bodyMedium,
                            color: secondaryText,
                            textAlign: TextAlign.start,
                            lineHeight: 1.46,
                            fontSize: 15,
                            fontWeight: FontWeight.w400,
                          ),
                          Text(
                            appState.userDetail.email,
                            style: bodyMedium,
                            textAlign: TextAlign.start,
                            lineHeight: 1.52,
                            fontSize: 17,
                            fontWeight: FontWeight.w400,
                          ),
                        ],
                        crossAxis: CrossAxis.start,
                        spacing: 5,
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
                    Container(
                      padding: EdgeInsets.all(16),
                      child: Column(
                        children: [
                          Text(
                            'Phone number',
                            style: bodyMedium,
                            color: secondaryText,
                            textAlign: TextAlign.start,
                            lineHeight: 1.46,
                            fontSize: 15,
                            fontWeight: FontWeight.w400,
                          ),
                          Text(
                            '${appState.userDetail.countryCode} ${appState.userDetail.phoneNumber}',
                            style: bodyMedium,
                            textAlign: TextAlign.start,
                            lineHeight: 1.52,
                            fontSize: 17,
                            fontWeight: FontWeight.w400,
                          ),
                        ],
                        crossAxis: CrossAxis.start,
                        spacing: 5,
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
                              delayMs: 250.0,
                              durationMs: 100.0,
                            ),
                            FadeEffect(
                              begin: 0,
                              end: 1,
                              delayMs: 250.0,
                              durationMs: 100.0,
                            ),
                          ],
                          applyInitialState: true,
                        ),
                      ],
                    ),
                  ],
                  spacing: 16,
                  primary: true,
                  startSpacing: 16,
                  endSpacing: 16,
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
