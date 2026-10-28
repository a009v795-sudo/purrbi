@Component()
class TipsBottomComponent {
  build() => Container(
    child: Container(
      child: Stack(
        children: [
          Column(
            children: [
              Container(
                color: borderColor,
                borderRadius: 100,
                width: 48,
                height: 6,
                margin: EdgeInsets.only(bottom: 16),
                outerAlignment: Alignment.topCenter,
                onTap: () {
                  DismissBottomSheet();
                },
              ),
              Column(
                children: [
                  Container(
                    child: MiniLogo(hight: 50.0, width: 50.0),
                    color: primaryLightColor,
                    width: 93,
                    alignment: Alignment.center,
                    margin: EdgeInsets.only(
                      left: Constant('mainPadding'),
                      right: Constant('mainPadding'),
                    ),
                    boxShape: BoxShape.circle,
                    outerAlignment: Alignment.center,
                  ),
                  Column(
                    children: [
                      Text(
                        'Barcode identifier',
                        style: bodyMedium,
                        textAlign: TextAlign.center,
                        lineHeight: 1.25,
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                        padding: EdgeInsets.only(top: 12),
                      ),
                      Text(
                        'Scan or upload barcodes for precise \nAI-powered identification and tracking.',
                        style: bodyMedium,
                        textAlign: TextAlign.center,
                        lineHeight: 1.33,
                        fontSize: 15,
                        fontWeight: FontWeight.w400,
                      ),
                    ],
                    spacing: 8,
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
                            Container(
                              padding: EdgeInsets.only(
                                left: 16,
                                top: 7,
                                right: 16,
                                bottom: 7,
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    IconData('infoyp', custom: true),
                                    color: primary,
                                  ),
                                  Text(
                                    'TIPS FOR BEST RESULT',
                                    style: bodyMedium,
                                    color: primary,
                                    textAlign: TextAlign.start,
                                    lineHeight: 1.2,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ],
                                spacing: 10,
                                minSize: MainAxisSize.min,
                              ),
                              color: primaryBackground,
                              borderRadius: 99,
                            ),
                          ],
                        ),
                        Column(
                          children: [
                            Text(
                              ' • Capture the full dial and case in frame',
                              style: bodyMedium,
                              color: secondaryText,
                              textAlign: TextAlign.start,
                              lineHeight: 1.29,
                              fontSize: 15,
                              fontWeight: FontWeight.w400,
                            ),
                            Text(
                              ' • Use even lighting and avoid glare on the crystal',
                              style: bodyMedium,
                              color: secondaryText,
                              textAlign: TextAlign.start,
                              lineHeight: 1.29,
                              fontSize: 15,
                              fontWeight: FontWeight.w400,
                            ),
                            Text(
                              ' • Include the crown, bezel, and bracelet when possible',
                              style: bodyMedium,
                              color: secondaryText,
                              textAlign: TextAlign.start,
                              lineHeight: 1.29,
                              fontSize: 15,
                              fontWeight: FontWeight.w400,
                            ),
                            Text(
                              'Comprehensive overview of barcode details',
                              style: bodyMedium,
                              color: secondaryText,
                              textAlign: TextAlign.start,
                              lineHeight: 1.29,
                              fontSize: 15,
                              fontWeight: FontWeight.w400,
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
                    borderWidth: 1.57,
                    margin: EdgeInsets.only(
                      left: Constant('mainPadding'),
                      top: 16,
                      right: Constant('mainPadding'),
                    ),
                  ),
                ],
              ),
            ],
            crossAxis: CrossAxis.start,
            scrollable: true,
            minSize: MainAxisSize.min,
            padding: EdgeInsets.only(top: 16, bottom: 16),
          ),
          Container(
            child: Icon(
              IconData('closeyp', custom: true),
              size: 20,
              color: primaryText,
            ),
            color: secondaryBackground,
            borderColor: borderColor,
            borderWidth: 1,
            width: 40,
            alignment: Alignment.center,
            margin: EdgeInsets.all(16),
            boxShape: BoxShape.circle,
            outerAlignment: Alignment.topRight,
            onTap: () {
              DismissBottomSheet();
            },
          ),
        ],
        alignment: Alignment.topLeft,
      ),
      color: secondaryBackground,
      borderRadius: BorderRadius.only(topLeft: 32, topRight: 32),
      width: double.infinity,
      height: ScreenPercent(55),
    ),
    color: Color(0x00000000),
    animations: [
      WidgetAnimation(
        effects: [
          FadeEffect(begin: 0.0, end: 1.0, delayMs: 0.0, durationMs: 300.0),
          SlideEffect(
            beginDx: 0.0,
            beginDy: 24.0,
            endDx: 0.0,
            endDy: 0.0,
            delayMs: 0.0,
            durationMs: 300.0,
          ),
        ],
        applyInitialState: true,
        hideBeforeAnimating: true,
      ),
    ],
  );
}
