@Page(route: '/')
class SettingsPage {
  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Column(
            children: [
              MainAppbar(
                title: 'Settings',
                isBack: false,
                isEdit: false,
                isShare: false,
              ),
              Expanded(
                ListView(
                  children: [
                    Column(
                      children: [
                        Container(
                          padding: EdgeInsets.all(16),
                          child: Column(
                            children: [
                              Row(
                                children: [
                                  Container(
                                    child: Icon(
                                      IconData('infoyp', custom: true),
                                      size: 20,
                                      color: primary,
                                    ),
                                    color: primaryLightColor,
                                    width: 38,
                                    alignment: Alignment.center,
                                    boxShape: BoxShape.circle,
                                  ),
                                  Expanded(
                                    Text(
                                      'About us',
                                      style: bodyMedium,
                                      maxLines: 1,
                                      textAlign: TextAlign.start,
                                      overflow: TextOverflow.ellipsis,
                                      lineHeight: 1.52,
                                      fontSize: 17,
                                      fontWeight: FontWeight.w400,
                                    ),
                                  ),
                                  Icon(
                                    IconData('arrowrightyp', custom: true),
                                    size: 20,
                                    color: iconColor,
                                  ),
                                ],
                                spacing: 12,
                                onTap: () {
                                  context.push(AboutUsPage());
                                },
                              ),
                              Container(
                                color: borderColor,
                                width: double.infinity,
                                height: 1,
                              ),
                              Row(
                                children: [
                                  Container(
                                    child: Icon(
                                      IconData(
                                        'termsconditionsyp',
                                        custom: true,
                                      ),
                                      size: 20,
                                      color: primary,
                                    ),
                                    color: primaryLightColor,
                                    width: 38,
                                    alignment: Alignment.center,
                                    boxShape: BoxShape.circle,
                                  ),
                                  Expanded(
                                    Text(
                                      'Terms & conditions',
                                      style: bodyMedium,
                                      maxLines: 1,
                                      textAlign: TextAlign.start,
                                      overflow: TextOverflow.ellipsis,
                                      lineHeight: 1.52,
                                      fontSize: 17,
                                      fontWeight: FontWeight.w400,
                                    ),
                                  ),
                                  Icon(
                                    IconData('arrowrightyp', custom: true),
                                    size: 20,
                                    color: iconColor,
                                  ),
                                ],
                                spacing: 12,
                                onTap: () {
                                  context.push(TermsConditionPage());
                                },
                              ),
                              Container(
                                color: borderColor,
                                width: double.infinity,
                                height: 1,
                              ),
                              Row(
                                children: [
                                  Container(
                                    child: Icon(
                                      IconData('ratethisappyp', custom: true),
                                      size: 20,
                                      color: primary,
                                    ),
                                    color: primaryLightColor,
                                    width: 38,
                                    alignment: Alignment.center,
                                    boxShape: BoxShape.circle,
                                  ),
                                  Expanded(
                                    Text(
                                      'Rate this app',
                                      style: bodyMedium,
                                      maxLines: 1,
                                      textAlign: TextAlign.start,
                                      overflow: TextOverflow.ellipsis,
                                      lineHeight: 1.52,
                                      fontSize: 17,
                                      fontWeight: FontWeight.w400,
                                    ),
                                  ),
                                  Icon(
                                    IconData('arrowrightyp', custom: true),
                                    size: 20,
                                    color: iconColor,
                                  ),
                                ],
                                spacing: 12,
                                visible: Constant('featureStoreLinks'),
                              ),
                              Container(
                                color: borderColor,
                                width: double.infinity,
                                height: 1,
                                visible: Constant('featureStoreLinks'),
                              ),
                              Row(
                                children: [
                                  Container(
                                    child: Icon(
                                      IconData(
                                        'sharewithfriendsyp',
                                        custom: true,
                                      ),
                                      size: 20,
                                      color: primary,
                                    ),
                                    color: primaryLightColor,
                                    width: 38,
                                    alignment: Alignment.center,
                                    boxShape: BoxShape.circle,
                                  ),
                                  Expanded(
                                    Text(
                                      'Share with friends',
                                      style: bodyMedium,
                                      maxLines: 1,
                                      textAlign: TextAlign.start,
                                      overflow: TextOverflow.ellipsis,
                                      lineHeight: 1.52,
                                      fontSize: 17,
                                      fontWeight: FontWeight.w400,
                                    ),
                                  ),
                                  Icon(
                                    IconData('arrowrightyp', custom: true),
                                    size: 20,
                                    color: iconColor,
                                  ),
                                ],
                                spacing: 12,
                                visible: Constant('featureStoreLinks'),
                              ),
                              Container(
                                color: borderColor,
                                width: double.infinity,
                                height: 1,
                                visible: Constant('featureStoreLinks'),
                              ),
                              Row(
                                children: [
                                  Container(
                                    child: Icon(
                                      IconData(
                                        'termsconditionsyp',
                                        custom: true,
                                      ),
                                      size: 20,
                                      color: primary,
                                    ),
                                    color: primaryLightColor,
                                    width: 38,
                                    alignment: Alignment.center,
                                    boxShape: BoxShape.circle,
                                  ),
                                  Expanded(
                                    Text(
                                      'Privacy policy',
                                      style: bodyMedium,
                                      maxLines: 1,
                                      textAlign: TextAlign.start,
                                      overflow: TextOverflow.ellipsis,
                                      lineHeight: 1.52,
                                      fontSize: 17,
                                      fontWeight: FontWeight.w400,
                                    ),
                                  ),
                                  Icon(
                                    IconData('arrowrightyp', custom: true),
                                    size: 20,
                                    color: iconColor,
                                  ),
                                ],
                                spacing: 12,
                                onTap: () {
                                  context.push(PrivacyPolicyPage());
                                },
                              ),
                              Container(
                                color: borderColor,
                                width: double.infinity,
                                height: 1,
                              ),
                              Row(
                                children: [
                                  Container(
                                    child: Icon(
                                      IconData('faqsyp', custom: true),
                                      size: 20,
                                      color: primary,
                                    ),
                                    color: primaryLightColor,
                                    width: 38,
                                    alignment: Alignment.center,
                                    boxShape: BoxShape.circle,
                                  ),
                                  Expanded(
                                    Text(
                                      'FAQs',
                                      style: bodyMedium,
                                      maxLines: 1,
                                      textAlign: TextAlign.start,
                                      overflow: TextOverflow.ellipsis,
                                      lineHeight: 1.52,
                                      fontSize: 17,
                                      fontWeight: FontWeight.w400,
                                    ),
                                  ),
                                  Icon(
                                    IconData('arrowrightyp', custom: true),
                                    size: 20,
                                    color: iconColor,
                                  ),
                                ],
                                spacing: 12,
                                onTap: () {
                                  context.push(FaqPage());
                                },
                              ),
                              Container(
                                color: borderColor,
                                width: double.infinity,
                                height: 1,
                              ),
                              Row(
                                children: [
                                  Container(
                                    child: Icon(
                                      IconData('feedbackyp', custom: true),
                                      size: 20,
                                      color: primary,
                                    ),
                                    color: primaryLightColor,
                                    width: 38,
                                    alignment: Alignment.center,
                                    boxShape: BoxShape.circle,
                                  ),
                                  Expanded(
                                    Text(
                                      'Feedback',
                                      style: bodyMedium,
                                      maxLines: 1,
                                      textAlign: TextAlign.start,
                                      overflow: TextOverflow.ellipsis,
                                      lineHeight: 1.52,
                                      fontSize: 17,
                                      fontWeight: FontWeight.w400,
                                    ),
                                  ),
                                  Icon(
                                    IconData('arrowrightyp', custom: true),
                                    size: 20,
                                    color: iconColor,
                                  ),
                                ],
                                spacing: 12,
                                visible: Constant('featureSupportContact'),
                              ),
                              Container(
                                color: borderColor,
                                width: double.infinity,
                                height: 1,
                                visible: Constant('featureSupportContact'),
                              ),
                              Row(
                                children: [
                                  Container(
                                    child: Icon(
                                      IconData('deleteaccountyp', custom: true),
                                      size: 20,
                                      color: primary,
                                    ),
                                    color: primaryLightColor,
                                    width: 38,
                                    alignment: Alignment.center,
                                    boxShape: BoxShape.circle,
                                  ),
                                  Expanded(
                                    Text(
                                      'Delete account',
                                      style: bodyMedium,
                                      maxLines: 1,
                                      textAlign: TextAlign.start,
                                      overflow: TextOverflow.ellipsis,
                                      lineHeight: 1.52,
                                      fontSize: 17,
                                      fontWeight: FontWeight.w400,
                                    ),
                                  ),
                                  Icon(
                                    IconData('arrowrightyp', custom: true),
                                    size: 20,
                                    color: iconColor,
                                  ),
                                ],
                                spacing: 12,
                                onTap: () {
                                  ShowBottomSheet(
                                    DeleteAccountDialog(
                                      onTapOk: () {
                                        DataClearBlock();
                                        DismissBottomSheet();
                                        context.push(
                                          DeleteAccountPage(),
                                          allowBack: false,
                                        );
                                      },
                                    ),
                                    backgroundColor: Color(0x00000000),
                                    enableDrag: false,
                                  );
                                },
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
                          name: 'TrustContainer',
                        ),
                      ],
                      crossAxis: CrossAxis.start,
                      animations: [
                        WidgetAnimation(
                          effects: [
                            SlideEffect(
                              beginDx: -100.0,
                              beginDy: 0,
                              endDx: 0,
                              endDy: 0,
                              delayMs: 100.0,
                              durationMs: 400.0,
                            ),
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
                      name: 'AccountColumn',
                    ),
                  ],
                  primary: true,
                  startSpacing: 16,
                  endSpacing: 12,
                ),
              ),
              Text(
                'Purrbi · development build 1.0.0',
                style: bodyMedium,
                color: primary,
                textAlign: TextAlign.center,
                lineHeight: 1.46,
                fontSize: 15,
                fontWeight: FontWeight.w500,
                padding: EdgeInsets.only(
                  left: Constant('mainPadding'),
                  top: 4,
                  right: Constant('mainPadding'),
                  bottom: 8,
                ),
                outerAlignment: Alignment.bottomCenter,
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
