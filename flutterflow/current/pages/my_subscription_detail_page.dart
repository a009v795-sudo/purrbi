@Page(route: '/')
class MySubscriptionDetailPage {
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
                    Container(
                      child: Icon(
                        IconData('crown', fontAwesome: 'crown'),
                        size: 42,
                        color: primary,
                      ),
                      color: secondary,
                      borderColor: Color(0x4CFFFFFF),
                      borderWidth: 1,
                      width: 99,
                      alignment: Alignment.center,
                      boxShape: BoxShape.circle,
                    ),
                    Column(
                      children: [
                        Container(
                          padding: EdgeInsets.all(6),
                          child: Text(
                            'ACTIVE PLAN',
                            style: bodyMedium,
                            color: primary,
                            textAlign: TextAlign.start,
                            lineHeight: 1.46,
                            fontSize: 12,
                            fontWeight: FontWeight.w400,
                          ),
                          color: secondary,
                          borderRadius: 16,
                          borderColor: Color(0x4CFFFFFF),
                          borderWidth: 1,
                          width: 108,
                          alignment: Alignment.center,
                          boxShape: BoxShape.rectangle,
                        ),
                      ],
                    ),
                    Container(
                      padding: EdgeInsets.all(16),
                      child: Column(
                        children: [
                          Column(
                            children: [
                              Row(
                                children: [
                                  Text(
                                    'Yearly premium',
                                    style: bodyMedium,
                                    color: primaryText,
                                    maxLines: 1,
                                    textAlign: TextAlign.start,
                                    overflow: TextOverflow.ellipsis,
                                    lineHeight: 1.3,
                                    fontSize: 20,
                                    fontWeight: FontWeight.w700,
                                  ),
                                  Container(
                                    padding: EdgeInsets.all(6),
                                    child: Text(
                                      'CURRENT PLAN',
                                      style: bodyMedium,
                                      color: secondaryText,
                                      textAlign: TextAlign.start,
                                      lineHeight: 1.46,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                    ),
                                    color: grey100,
                                    borderRadius: 8,
                                    borderColor: Color(0x4CFFFFFF),
                                    borderWidth: 1,
                                    boxShape: BoxShape.rectangle,
                                  ),
                                ],
                                mainAxis: MainAxis.spaceBetween,
                                spacing: 8,
                                padding: EdgeInsets.only(bottom: 11),
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
                                          fontSize: 18,
                                          bold: true,
                                          style: bodyMedium,
                                          lineHeight: 1.21,
                                        ),
                                        RichTextSpan(
                                          '/ year',
                                          color: secondaryText,
                                          fontSize: 15,
                                          style: bodyMedium,
                                          lineHeight: 1.29,
                                        ),
                                      ],
                                      textAlign: TextAlign.start,
                                      color: Color(0xFFFFFFFF),
                                      fontSize: 18,
                                      fontWeight: FontWeight.w600,
                                      lineHeight: 1.28,
                                    ),
                                  ),
                                ],
                                mainAxis: MainAxis.spaceBetween,
                                crossAxis: CrossAxis.start,
                                spacing: 8,
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
                                    Column(
                                      children: [
                                        Text(
                                          'Start Date',
                                          style: bodyMedium,
                                          color: secondaryText,
                                          textAlign: TextAlign.start,
                                          lineHeight: 1.46,
                                          fontSize: 15,
                                          fontWeight: FontWeight.w400,
                                        ),
                                        Text(
                                          '31-12-2026',
                                          style: bodyMedium,
                                          color: primaryText,
                                          textAlign: TextAlign.start,
                                          lineHeight: 1.46,
                                          fontSize: 15,
                                          fontWeight: FontWeight.w400,
                                        ),
                                      ],
                                      crossAxis: CrossAxis.start,
                                    ),
                                  ),
                                  Expanded(
                                    Column(
                                      children: [
                                        Text(
                                          'Start Date',
                                          style: bodyMedium,
                                          color: secondaryText,
                                          textAlign: TextAlign.start,
                                          lineHeight: 1.46,
                                          fontSize: 15,
                                          fontWeight: FontWeight.w400,
                                        ),
                                        Text(
                                          '31-12-2026',
                                          style: bodyMedium,
                                          color: primaryText,
                                          textAlign: TextAlign.start,
                                          lineHeight: 1.46,
                                          fontSize: 15,
                                          fontWeight: FontWeight.w400,
                                        ),
                                      ],
                                      crossAxis: CrossAxis.end,
                                    ),
                                  ),
                                ],
                                mainAxis: MainAxis.end,
                                crossAxis: CrossAxis.start,
                                spacing: 16,
                              ),
                            ],
                            crossAxis: CrossAxis.start,
                          ),
                        ],
                        crossAxis: CrossAxis.start,
                      ),
                      borderRadius: 16,
                      borderColor: borderColor,
                      width: double.infinity,
                      margin: EdgeInsets.only(
                        left: Constant('mainPadding'),
                        right: Constant('mainPadding'),
                      ),
                    ),
                    Column(
                      children: [
                        Text(
                          'What\'s included',
                          style: bodyMedium,
                          textAlign: TextAlign.start,
                          lineHeight: 1.33,
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          padding: EdgeInsets.only(
                            left: Constant('mainPadding'),
                            right: Constant('mainPadding'),
                          ),
                        ),
                        Container(
                          padding: EdgeInsets.all(16),
                          child: Column(
                            children: [
                              Row(
                                children: [
                                  Icon(
                                    IconData('checkcircleuyp', custom: true),
                                    size: 20,
                                    color: primary,
                                  ),
                                  Expanded(
                                    Text(
                                      '10 Barcode scans per day',
                                      style: bodyMedium,
                                      color: primaryText,
                                      textAlign: TextAlign.start,
                                      lineHeight: 1.46,
                                      fontSize: 15,
                                      fontWeight: FontWeight.w400,
                                    ),
                                  ),
                                ],
                                crossAxis: CrossAxis.start,
                                spacing: 8,
                              ),
                              Row(
                                children: [
                                  Icon(
                                    IconData('checkcircleuyp', custom: true),
                                    size: 20,
                                    color: primary,
                                  ),
                                  Expanded(
                                    Text(
                                      '10 AI chat messages per day',
                                      style: bodyMedium,
                                      color: primaryText,
                                      textAlign: TextAlign.start,
                                      lineHeight: 1.46,
                                      fontSize: 15,
                                      fontWeight: FontWeight.w400,
                                    ),
                                  ),
                                ],
                                crossAxis: CrossAxis.start,
                                spacing: 8,
                              ),
                              Row(
                                children: [
                                  Icon(
                                    IconData('checkcircleuyp', custom: true),
                                    size: 20,
                                    color: primary,
                                  ),
                                  Expanded(
                                    Text(
                                      'Advanced tools and capabilities',
                                      style: bodyMedium,
                                      color: primaryText,
                                      textAlign: TextAlign.start,
                                      lineHeight: 1.46,
                                      fontSize: 15,
                                      fontWeight: FontWeight.w400,
                                    ),
                                  ),
                                ],
                                crossAxis: CrossAxis.start,
                                spacing: 8,
                              ),
                              Row(
                                children: [
                                  Icon(
                                    IconData('checkcircleuyp', custom: true),
                                    size: 20,
                                    color: primary,
                                  ),
                                  Expanded(
                                    Text(
                                      'No ads',
                                      style: bodyMedium,
                                      color: primaryText,
                                      textAlign: TextAlign.start,
                                      lineHeight: 1.46,
                                      fontSize: 15,
                                      fontWeight: FontWeight.w400,
                                    ),
                                  ),
                                ],
                                crossAxis: CrossAxis.start,
                                spacing: 8,
                              ),
                            ],
                            crossAxis: CrossAxis.start,
                            spacing: 12,
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
                      crossAxis: CrossAxis.start,
                      spacing: 16,
                      name: 'BenefitsColumn',
                    ),
                  ],
                  spacing: 16,
                  primary: true,
                  startSpacing: 16,
                  endSpacing: 12,
                ),
              ),
              Text(
                'Need to make a change?',
                style: bodyMedium,
                textAlign: TextAlign.center,
                fontSize: 15,
                fontWeight: FontWeight.w600,
                padding: EdgeInsets.only(bottom: 8),
                outerAlignment: Alignment.topCenter,
              ),
              Text(
                'You can manage billing anytime. Access stays active until 31 Dec 2026.',
                style: bodyMedium,
                color: secondaryText,
                textAlign: TextAlign.center,
                fontSize: 13,
                fontWeight: FontWeight.w400,
                padding: EdgeInsets.only(left: 16, right: 16),
                outerAlignment: Alignment.topCenter,
              ),
              Button(
                'Cancel subscription',
                width: double.infinity,
                height: 56,
                color: secondaryBackground,
                textColor: error,
                borderRadius: 999,
                style: titleSmall,
                fontSize: 18,
                fontWeight: FontWeight.w600,
                lineHeight: 1,
                borderColor: error,
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
                    Wait(1000);
                    context.push(SelectReasonPage());
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
      color: bgColor,
      width: double.infinity,
      height: double.infinity,
    ),
    backgroundColor: bgColor,
    safeArea: false,
  );
}
