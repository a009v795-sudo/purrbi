@Page(route: '/')
class NotificationPage {
  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Column(
            children: [
              MainAppbar(
                title: 'Notifications',
                isBack: false,
                isEdit: false,
                isShare: false,
              ),
              Expanded(
                ListView(
                  empty: NoNotificationComponent(),
                  source: appState.notificationsList,
                  itemBuilder:
                      (notificationList) => Container(
                        padding: EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Container(
                              child: Icon(
                                IconData('notificationyp', custom: true),
                                color: primary,
                              ),
                              color: primaryLightColor,
                              width: 40,
                              alignment: Alignment.center,
                              boxShape: BoxShape.circle,
                            ),
                            Expanded(
                              Column(
                                children: [
                                  Text(
                                    notificationList.title,
                                    style: bodyMedium,
                                    textAlign: TextAlign.start,
                                    lineHeight: 1.33,
                                    fontSize: 18,
                                    fontWeight: FontWeight.w600,
                                  ),
                                  Text(
                                    notificationList.subTitle,
                                    style: bodyMedium,
                                    color: secondaryText,
                                    textAlign: TextAlign.start,
                                    lineHeight: 1.52,
                                    fontSize: 17,
                                    fontWeight: FontWeight.w400,
                                    padding: EdgeInsets.only(
                                      top: 13,
                                      bottom: 14,
                                    ),
                                  ),
                                  Text(
                                    notificationList.createAt,
                                    style: bodyMedium,
                                    color: secondaryText,
                                    textAlign: TextAlign.start,
                                    lineHeight: 1.46,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ],
                                crossAxis: CrossAxis.start,
                                padding: EdgeInsets.only(top: 6),
                              ),
                            ),
                          ],
                          crossAxis: CrossAxis.start,
                          spacing: 12,
                        ),
                        color: buttonBg,
                        borderRadius: 20,
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
                              FadeEffect(
                                begin: 0,
                                end: 1,
                                delayMs: notificationList.index * 50,
                                durationMs: 600.0,
                              ),
                            ],
                            applyInitialState: true,
                          ),
                        ],
                      ),
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
