@Page(route: '/')
class MyEmptySubscriptionPage {
  build() => Scaffold(
    body: Container(
      child: Container(
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
                    context.safePop();
                  },
                ),
                Column(
                  children: [
                    Text(
                      'Upgrade to premium',
                      style: bodyMedium,
                      color: Color(0xFFFFFFFF),
                      textAlign: TextAlign.center,
                      lineHeight: 1.21,
                      fontSize: 28,
                      fontWeight: FontWeight.w700,
                    ),
                    Text(
                      'Unlock more tools, faster performance, and exclusive features',
                      style: bodyMedium,
                      color: Color(0xFFFFFFFF),
                      maxLines: 2,
                      textAlign: TextAlign.center,
                      lineHeight: 1.52,
                      fontSize: 17,
                      fontWeight: FontWeight.w400,
                    ),
                  ],
                  mainAxis: MainAxis.end,
                  spacing: 6,
                  minSize: MainAxisSize.min,
                  padding: EdgeInsets.only(left: 34, right: 34, bottom: 66),
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
                        Text(
                          'Unlock premium features',
                          style: bodyMedium,
                          textAlign: TextAlign.center,
                          lineHeight: 1.21,
                          fontSize: 24,
                          fontWeight: FontWeight.w700,
                          padding: EdgeInsets.only(
                            left: Constant('mainPadding'),
                            right: Constant('mainPadding'),
                          ),
                        ),
                        Text(
                          'Unlimited barcode scans',
                          style: bodyMedium,
                          color: secondaryText,
                          textAlign: TextAlign.center,
                          lineHeight: 1.33,
                          fontSize: 18,
                          fontWeight: FontWeight.w400,
                          padding: EdgeInsets.only(
                            left: Constant('mainPadding'),
                            top: 12,
                            right: Constant('mainPadding'),
                            bottom: 26,
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
                                    padding: EdgeInsets.only(top: 2),
                                  ),
                                  Expanded(
                                    Text(
                                      'Unlimited barcode scans',
                                      style: bodyMedium,
                                      textAlign: TextAlign.start,
                                      lineHeight: 1.52,
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
                                      'Faster ai processing',
                                      style: bodyMedium,
                                      textAlign: TextAlign.start,
                                      lineHeight: 1.52,
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
                                      lineHeight: 1.52,
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
                                      'Scan history & favorites',
                                      style: bodyMedium,
                                      textAlign: TextAlign.start,
                                      lineHeight: 1.52,
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
                            right: Constant('mainPadding'),
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
                      ],
                      primary: true,
                      startSpacing: 12,
                      endSpacing: 12,
                    ),
                  ),
                  Button(
                    'Get premium access',
                    icon: IconSpec(
                      IconData('crownyp', custom: true),
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
                      top: 4,
                      right: Constant('mainPadding'),
                      bottom: 16,
                    ),
                    onTap: () {
                      if (appState.connected) {
                        context.push(PremiumPage(isEmpty: true));
                      } else {
                        internetSnackbar(shouldSetState: true);
                      }
                    },
                  ),
                  Row(
                    children: [
                      Text(
                        'Restore purchase',
                        style: bodyMedium,
                        color: secondaryText,
                        textAlign: TextAlign.center,
                        lineHeight: 1.52,
                        fontSize: 17,
                        fontWeight: FontWeight.w400,
                      ),
                    ],
                    mainAxis: MainAxis.center,
                    spacing: 12,
                    padding: EdgeInsets.only(
                      left: Constant('mainPadding'),
                      right: Constant('mainPadding'),
                      bottom: 24,
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
        color: secondaryBackground,
        width: double.infinity,
        height: double.infinity,
        maxWidth: Constant('maxWidth'),
      ),
      color: bgColor,
      width: double.infinity,
      height: double.infinity,
      alignment: Alignment.topCenter,
    ),
    backgroundColor: bgColor,
    safeArea: false,
  );
}
