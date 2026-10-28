@Page(route: '/')
class PremiumPage {
  final bool isEmpty = false;
  int planIndex = 2;
  build() => Scaffold(
    body: Container(
      child: Stack(
        children: [
          Stack(
            children: [
              Image(
                'projects/a-i-barcode-identifier-app-ahbvz7/assets/vrbav0c1t14z/pro-image_s.png',
                isNetwork: false,
                width: double.infinity,
                height: double.infinity,
                borderRadius: 0,
              ),
              Container(
                child: Icon(
                  IconData('closeyp', custom: true),
                  size: 20,
                  color: Color(0xFFFFFFFF),
                ),
                color: Color(0x19160303),
                borderColor: Color(0x7FE8EDFF),
                borderWidth: 1,
                width: 40,
                alignment: Alignment.center,
                margin: EdgeInsets.only(top: 11, right: 16),
                boxShape: BoxShape.circle,
                safeArea: true,
                outerAlignment: Alignment.topRight,
                onTap: () {
                  if (isEmpty) {
                    context.safePop();
                  } else {
                    context.push(HomeMainPage(), allowBack: false);
                  }
                },
              ),
              Container(
                padding: EdgeInsets.only(
                  left: Constant('mainPadding'),
                  right: Constant('mainPadding'),
                ),
                child: Column(
                  children: [
                    Text(
                      'Upgrade to premium',
                      style: bodyMedium,
                      color: Color(0xFFFFFFFF),
                      maxLines: 2,
                      textAlign: TextAlign.center,
                      lineHeight: 1.21,
                      fontSize: 28,
                      fontWeight: FontWeight.w700,
                      autoSize: true,
                    ),
                    Text(
                      'Unlock more tools, faster performance, and exclusive features',
                      style: bodyMedium,
                      color: Color(0xFFFFFFFF),
                      maxLines: 2,
                      textAlign: TextAlign.center,
                      lineHeight: 1.29,
                      fontSize: 17,
                      fontWeight: FontWeight.w400,
                      autoSize: true,
                      padding: EdgeInsets.only(bottom: 20),
                    ),
                    Container(height: ScreenPercent(2)),
                  ],
                  mainAxis: MainAxis.end,
                  spacing: 6,
                  minSize: MainAxisSize.min,
                ),
                safeArea: true,
                outerAlignment: Alignment.bottomCenter,
              ),
            ],
            height: ScreenPercent(40),
            alignment: Alignment.topLeft,
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
          Container(
            padding: EdgeInsets.only(top: 4),
            child: Column(
              children: [
                Expanded(
                  ListView(
                    children: [
                      Column(
                        children: [
                          Stack(
                            children: [
                              Container(
                                padding: EdgeInsets.all(16),
                                child: Column(
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          Text(
                                            'Yearly plan',
                                            style: bodyMedium,
                                            maxLines: 1,
                                            textAlign: TextAlign.start,
                                            overflow: TextOverflow.ellipsis,
                                            lineHeight: 1.28,
                                            fontSize: 18,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                        Container(
                                          padding: EdgeInsets.all(6),
                                          child: Text(
                                            'Just \$3.33 / month',
                                            style: bodyMedium,
                                            color: primary,
                                            textAlign: TextAlign.start,
                                            lineHeight: 1.33,
                                            fontSize: 15,
                                            fontWeight: FontWeight.w500,
                                          ),
                                          color: primaryLightColor,
                                          borderRadius: 24,
                                          borderColor: borderColor,
                                        ),
                                      ],
                                      mainAxis: MainAxis.spaceBetween,
                                      crossAxis: CrossAxis.start,
                                      spacing: 4,
                                    ),
                                    RichText(
                                      style: bodyMedium,
                                      maxLines: 1,
                                      spans: [
                                        RichTextSpan(
                                          '${appState.currencyType}40.00',
                                          fontSize: 20,
                                          style: bodyMedium,
                                          fontWeight: FontWeight.w700,
                                          lineHeight: 1.2,
                                        ),
                                        RichTextSpan(
                                          '/ year ',
                                          color: secondaryText,
                                          fontSize: 15,
                                          style: bodyMedium,
                                          lineHeight: 1.33,
                                        ),
                                        RichTextSpan(
                                          Bound(
                                            '85126c41',
                                            'functionCall stringInterpolation',
                                          ),
                                          color: secondaryText,
                                          fontSize: 15,
                                          strikethrough: true,
                                          lineHeight: 1.33,
                                        ),
                                      ],
                                      textAlign: TextAlign.start,
                                    ),
                                  ],
                                  crossAxis: CrossAxis.start,
                                  spacing: 2,
                                ),
                                color:
                                    (planIndex == 0)
                                        ? primaryBackground
                                        : secondaryBackground,
                                borderRadius: 16,
                                borderColor:
                                    (planIndex == 0) ? primary : borderColor,
                                borderWidth: 1,
                                width: double.infinity,
                                margin: EdgeInsets.only(top: 12),
                              ),
                              Container(
                                padding: EdgeInsets.only(
                                  left: 8,
                                  top: 4,
                                  right: 8,
                                  bottom: 4,
                                ),
                                child: Text(
                                  'BEST VALUE-SAVE50%',
                                  style: bodyMedium,
                                  color: Color(0xFFFFFFFF),
                                  textAlign: TextAlign.start,
                                  lineHeight: 1.31,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                                color: primary,
                                borderRadius: 12,
                                margin: EdgeInsets.only(left: 16),
                              ),
                            ],
                            width: double.infinity,
                            alignment: Alignment.topLeft,
                            padding: EdgeInsets.only(
                              left: Constant('mainPadding'),
                              right: Constant('mainPadding'),
                            ),
                            onTap: () {
                              planIndex = 0;
                            },
                          ),
                          Container(
                            padding: EdgeInsets.all(16),
                            child: Column(
                              children: [
                                Text(
                                  'Monthly plan',
                                  style: bodyMedium,
                                  textAlign: TextAlign.start,
                                  lineHeight: 1.28,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w500,
                                ),
                                RichText(
                                  style: bodyMedium,
                                  maxLines: 1,
                                  spans: [
                                    RichTextSpan(
                                      '${appState.currencyType}9.00',
                                      fontSize: 20,
                                      style: bodyMedium,
                                      fontWeight: FontWeight.w700,
                                      lineHeight: 1.2,
                                    ),
                                    RichTextSpan(
                                      '/ month',
                                      color: secondaryText,
                                      fontSize: 15,
                                      style: bodyMedium,
                                      lineHeight: 1.33,
                                    ),
                                  ],
                                  textAlign: TextAlign.start,
                                ),
                              ],
                              crossAxis: CrossAxis.start,
                              spacing: 8,
                            ),
                            color:
                                (planIndex == 1)
                                    ? primaryBackground
                                    : secondaryBackground,
                            borderRadius: 16,
                            borderColor:
                                (planIndex == 1) ? primary : borderColor,
                            borderWidth: 1,
                            width: double.infinity,
                            margin: EdgeInsets.only(
                              left: Constant('mainPadding'),
                              right: Constant('mainPadding'),
                            ),
                            onTap: () {
                              planIndex = 1;
                            },
                          ),
                          Container(
                            padding: EdgeInsets.all(16),
                            child: Column(
                              children: [
                                Text(
                                  'Weekly plan',
                                  style: bodyMedium,
                                  textAlign: TextAlign.start,
                                  lineHeight: 1.28,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w500,
                                ),
                                RichText(
                                  style: bodyMedium,
                                  maxLines: 1,
                                  spans: [
                                    RichTextSpan(
                                      '${appState.currencyType}4.00',
                                      fontSize: 20,
                                      style: bodyMedium,
                                      fontWeight: FontWeight.w700,
                                      lineHeight: 1.2,
                                    ),
                                    RichTextSpan(
                                      '/ week',
                                      color: secondaryText,
                                      fontSize: 15,
                                      style: bodyMedium,
                                      lineHeight: 1.33,
                                    ),
                                  ],
                                  textAlign: TextAlign.start,
                                ),
                              ],
                              crossAxis: CrossAxis.start,
                              spacing: 8,
                            ),
                            color:
                                (planIndex == 2)
                                    ? primaryBackground
                                    : secondaryBackground,
                            borderRadius: 16,
                            borderColor:
                                (planIndex == 2) ? primary : borderColor,
                            borderWidth: 1,
                            width: double.infinity,
                            margin: EdgeInsets.only(
                              left: Constant('mainPadding'),
                              right: Constant('mainPadding'),
                            ),
                            onTap: () {
                              planIndex = 2;
                            },
                          ),
                        ],
                        crossAxis: CrossAxis.start,
                        spacing: 16,
                        startSpacing: 8,
                        endSpacing: 16,
                        animations: [
                          WidgetAnimation(
                            effects: [
                              ScaleEffect(
                                beginDx: 1.05,
                                endDx: 1.0,
                                beginDy: 1.05,
                                endDy: 1,
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
                        name: 'PlanColumn',
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
                                  padding: EdgeInsets.only(top: 2),
                                ),
                                Expanded(
                                  Text(
                                    '10 barcode scans per day',
                                    style: bodyMedium,
                                    textAlign: TextAlign.start,
                                    lineHeight: 1.29,
                                    fontSize: 17,
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
                                  padding: EdgeInsets.only(top: 2),
                                ),
                                Expanded(
                                  Text(
                                    '10 AI chat messages per day',
                                    style: bodyMedium,
                                    textAlign: TextAlign.start,
                                    lineHeight: 1.29,
                                    fontSize: 17,
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
                                  padding: EdgeInsets.only(top: 2),
                                ),
                                Expanded(
                                  Text(
                                    'Advanced tools and capabilities',
                                    style: bodyMedium,
                                    textAlign: TextAlign.start,
                                    lineHeight: 1.29,
                                    fontSize: 17,
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
                                  padding: EdgeInsets.only(top: 2),
                                ),
                                Expanded(
                                  Text(
                                    'No ads',
                                    style: bodyMedium,
                                    textAlign: TextAlign.start,
                                    lineHeight: 1.29,
                                    fontSize: 17,
                                    fontWeight: FontWeight.w400,
                                  ),
                                ),
                              ],
                              crossAxis: CrossAxis.start,
                              spacing: 8,
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
                          top: 8,
                          right: Constant('mainPadding'),
                        ),
                      ),
                    ],
                    primary: true,
                    startSpacing: 4,
                    endSpacing: 16,
                  ),
                ),
                Button(
                  'Purchase now',
                  width: double.infinity,
                  height: 56,
                  borderRadius: 60,
                  style: titleSmall,
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  lineHeight: 1,
                  elevation: 0,
                  innerPadding: EdgeInsets.only(left: 20, right: 20),
                  padding: EdgeInsets.only(
                    left: Constant('mainPadding'),
                    top: 4,
                    right: Constant('mainPadding'),
                    bottom: 16,
                  ),
                  onTap: () {
                    if (appState.connected) {
                      context.push(PaymentMethodPage());
                    } else {
                      internetSnackbar(shouldSetState: true);
                    }
                  },
                ),
                Row(
                  children: [
                    Expanded(
                      Text(
                        'Restore purchase',
                        style: bodyMedium,
                        color: secondaryText,
                        maxLines: 1,
                        textAlign: TextAlign.center,
                        overflow: TextOverflow.ellipsis,
                        lineHeight: 1.33,
                        fontSize: 12,
                        fontWeight: FontWeight.w400,
                        underline: true,
                      ),
                    ),
                    Container(
                      color: secondaryText,
                      width: 5,
                      boxShape: BoxShape.circle,
                    ),
                    Expanded(
                      Text(
                        'How to cancel?',
                        style: bodyMedium,
                        color: secondaryText,
                        maxLines: 1,
                        textAlign: TextAlign.center,
                        overflow: TextOverflow.ellipsis,
                        lineHeight: 1.33,
                        fontSize: 12,
                        fontWeight: FontWeight.w400,
                        underline: true,
                      ),
                    ),
                    Container(
                      color: secondaryText,
                      width: 5,
                      boxShape: BoxShape.circle,
                    ),
                    Expanded(
                      Text(
                        'Privacy policy',
                        style: bodyMedium,
                        color: secondaryText,
                        maxLines: 1,
                        textAlign: TextAlign.center,
                        overflow: TextOverflow.ellipsis,
                        lineHeight: 1.33,
                        fontSize: 12,
                        fontWeight: FontWeight.w400,
                        underline: true,
                        onTap: () {
                          context.push(PrivacyPolicyPage());
                        },
                      ),
                    ),
                  ],
                  mainAxis: MainAxis.center,
                  spacing: 12,
                  padding: EdgeInsets.only(
                    left: Constant('mainPadding'),
                    right: Constant('mainPadding'),
                    bottom: 16,
                  ),
                ),
              ],
              crossAxis: CrossAxis.start,
            ),
            color: secondaryBackground,
            borderRadius: BorderRadius.only(topLeft: 24, topRight: 24),
            width: double.infinity,
            height: ScreenPercent(64),
            safeArea: true,
            outerAlignment: Alignment.bottomCenter,
          ),
        ],
        width: double.infinity,
        height: double.infinity,
        alignment: Alignment.topLeft,
      ),
      width: double.infinity,
      height: double.infinity,
      maxWidth: Constant('maxWidth'),
      outerAlignment: Alignment.topCenter,
    ),
    backgroundColor: bgColor,
    safeArea: false,
    disableAndroidBackButton: true,
  );
}
