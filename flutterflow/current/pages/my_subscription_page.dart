@Page(route: '/')
class MySubscriptionPage {
  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Column(
            children: [
              MainAppbar(
                title: 'My subscription',
                isBack: false,
                isEdit: false,
                isShare: false,
              ),
              Expanded(
                ListView(
                  children: [
                    Text(
                      'Manage your subscription and billing details. \nenjoy premium insights.',
                      style: bodyMedium,
                      textAlign: TextAlign.start,
                      lineHeight: 1.46,
                      fontSize: 15,
                      fontWeight: FontWeight.w400,
                      padding: EdgeInsets.only(
                        left: Constant('mainPadding'),
                        right: Constant('mainPadding'),
                        bottom: 24,
                      ),
                    ),
                    Container(
                      padding: EdgeInsets.all(16),
                      child: Column(
                        children: [
                          Column(
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: EdgeInsets.only(
                                      left: 8,
                                      top: 6,
                                      right: 8,
                                      bottom: 6,
                                    ),
                                    child: Text(
                                      'CURRENT PLAN',
                                      style: bodyMedium,
                                      color: grey40,
                                      textAlign: TextAlign.start,
                                      lineHeight: 1.46,
                                      fontSize: 15,
                                      fontWeight: FontWeight.w600,
                                    ),
                                    color: grey100,
                                    borderRadius: 12,
                                    borderColor: Color(0x4CFFFFFF),
                                    borderWidth: 1,
                                    boxShape: BoxShape.rectangle,
                                  ),
                                ],
                                mainAxis: MainAxis.spaceBetween,
                                spacing: 8,
                              ),
                              Text(
                                'Yearly premium',
                                style: bodyMedium,
                                color: primaryText,
                                textAlign: TextAlign.start,
                                lineHeight: 1.3,
                                fontSize: 20,
                                fontWeight: FontWeight.w700,
                                padding: EdgeInsets.only(top: 3, bottom: 12),
                              ),
                              Row(
                                children: [
                                  Expanded(
                                    Text(
                                      'Expires on 31 Dec 2026',
                                      style: bodyMedium,
                                      color: primaryText,
                                      maxLines: 1,
                                      textAlign: TextAlign.start,
                                      lineHeight: 1.46,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w400,
                                    ),
                                  ),
                                  Container(
                                    color: borderColor,
                                    width: 1,
                                    height: 20,
                                  ),
                                  Expanded(
                                    Text(
                                      'Renews on 21 Dec 2026',
                                      style: bodyMedium,
                                      color: primaryText,
                                      maxLines: 1,
                                      textAlign: TextAlign.end,
                                      lineHeight: 1.38,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                                crossAxis: CrossAxis.start,
                                spacing: 16,
                              ),
                            ],
                            crossAxis: CrossAxis.start,
                          ),
                          Container(
                            color: borderColor,
                            width: double.infinity,
                            height: 1,
                            margin: EdgeInsets.only(top: 16, bottom: 12),
                          ),
                          Row(
                            children: [
                              Expanded(
                                RichText(
                                  style: bodyMedium,
                                  maxLines: 1,
                                  spans: [
                                    RichTextSpan(
                                      '${appState.currencyType}50.00',
                                      color: primaryText,
                                      fontSize: 24,
                                      style: bodyMedium,
                                      fontWeight: FontWeight.w700,
                                      lineHeight: 1.21,
                                    ),
                                    RichTextSpan(
                                      '/ year',
                                      color: primaryText,
                                      fontSize: 17,
                                      style: bodyMedium,
                                      lineHeight: 1.29,
                                    ),
                                  ],
                                  textAlign: TextAlign.start,
                                  color: primaryText,
                                  fontSize: 17,
                                  lineHeight: 1.28,
                                ),
                              ),
                            ],
                            mainAxis: MainAxis.spaceBetween,
                            crossAxis: CrossAxis.start,
                            spacing: 8,
                          ),
                        ],
                        crossAxis: CrossAxis.start,
                      ),
                      color: secondaryBackground,
                      borderRadius: 16,
                      borderColor: borderColor,
                      width: double.infinity,
                      margin: EdgeInsets.only(
                        left: Constant('mainPadding'),
                        right: Constant('mainPadding'),
                      ),
                      onTap: () {
                        if (appState.connected) {
                          context.push(MySubscriptionDetailPage());
                        } else {
                          internetSnackbar(shouldSetState: true);
                        }
                      },
                    ),
                    Container(
                      padding: EdgeInsets.all(16),
                      child: Column(
                        children: [
                          Text(
                            'Change plan',
                            style: bodyMedium,
                            fontSize: 17,
                            fontWeight: FontWeight.w500,
                            onTap: () {
                              context.push(PaymentMethodPage());
                            },
                          ),
                          Container(
                            color: borderColor,
                            width: double.infinity,
                            height: 1,
                            margin: EdgeInsets.only(top: 16, bottom: 16),
                          ),
                          Text(
                            'Cancel subscription',
                            style: bodyMedium,
                            color: error,
                            fontSize: 17,
                            fontWeight: FontWeight.w500,
                            onTap: () {
                              context.push(SelectReasonPage());
                            },
                          ),
                        ],
                        crossAxis: CrossAxis.start,
                      ),
                      color: secondaryBackground,
                      borderRadius: 16,
                      borderColor: borderColor,
                      width: 100,
                      margin: EdgeInsets.all(16),
                    ),
                  ],
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
