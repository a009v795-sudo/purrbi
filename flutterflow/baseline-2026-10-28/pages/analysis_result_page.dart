@Page(route: '/')
class AnalysisResultPage {
  final UploadedFile imageUpload;
  final String scanType;
  int timeIndex = 1;
  double progress = 0.1;
  onLoad() {
    while (timeIndex < 10) {
      Wait(1000);
      SetState.batch([progress += 0.1, timeIndex += 1]);
    }
    appState.isAdsTap += 1;
    context.push(
      ResultPage(uplodImage: imageUpload, title: 'Bengal Health & Beauty'),
    );
  }

  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Column(
            children: [
              Row(
                children: [
                  Container(
                    child: Icon(
                      IconData('closeyp', custom: true),
                      color: primaryText,
                    ),
                    color: buttonBg,
                    borderColor: borderColor,
                    borderWidth: 1,
                    width: 40,
                    alignment: Alignment.center,
                    boxShape: BoxShape.circle,
                    onTap: () {
                      context.safePop();
                    },
                  ),
                ],
                padding: EdgeInsets.only(
                  left: Constant('mainPadding'),
                  top: 60,
                  right: Constant('mainPadding'),
                  bottom: 12,
                ),
              ),
              Expanded(
                Column(
                  children: [
                    Stack(
                      children: [
                        ProgressBar.circular(
                          size: 91,
                          thickness: 8,
                          value: progress,
                          animation: true,
                          progressColor: primary,
                          backgroundColor: primaryLightColor,
                        ),
                        Icon(
                          IconData('sparkleyp', custom: true),
                          size: 40,
                          color: primary,
                        ),
                      ],
                    ),
                    Column(
                      children: [
                        Text(
                          'Scanning with AI',
                          style: bodyMedium,
                          textAlign: TextAlign.center,
                          lineHeight: 1.3,
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                        ),
                        Text(
                          'Preparing your results, please wait just a moment now.',
                          style: bodyMedium,
                          textAlign: TextAlign.center,
                          lineHeight: 1.46,
                          fontSize: 15,
                          fontWeight: FontWeight.w400,
                          padding: EdgeInsets.only(left: 16, right: 16),
                        ),
                      ],
                      spacing: 8,
                    ),
                    ProgressBar.linear(
                      thickness: 10,
                      value: progress,
                      animation: true,
                      progressColor: primary,
                      backgroundColor: primaryLightColor,
                      barRadius: 999,
                    ),
                  ],
                  spacing: 24,
                  scrollable: true,
                  startSpacing: 40,
                  endSpacing: 12,
                  padding: EdgeInsets.only(
                    left: Constant('mainPadding'),
                    right: Constant('mainPadding'),
                  ),
                ),
              ),
              Container(
                child: Container(
                  padding: EdgeInsets.only(top: 16, bottom: 16),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          ConditionalBuilder(
                            children: [
                              PlaceholderWidget(
                                children: [
                                  Container(
                                    child: Icon(
                                      'done_rounded',
                                      size: 20,
                                      color: Color(0xFFFFFFFF),
                                    ),
                                    color: primary,
                                    width: 30,
                                    alignment: Alignment.center,
                                    boxShape: BoxShape.circle,
                                  ),
                                ],
                                visible: timeIndex > 1,
                              ),
                              PlaceholderWidget(
                                children: [
                                  Container(
                                    child: CirculatIndicatorWhite(
                                      width: 20,
                                      height: 20,
                                    ),
                                    color: primary,
                                    width: 30,
                                    alignment: Alignment.center,
                                    boxShape: BoxShape.circle,
                                  ),
                                ],
                              ),
                            ],
                          ),
                          Expanded(
                            Column(
                              children: [
                                Text(
                                  'Identifying animal species',
                                  style: bodyMedium,
                                  textAlign: TextAlign.start,
                                  lineHeight: 1.46,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                ),
                                Text(
                                  'Barcode successfully detected from the uploaded image.',
                                  style: bodyMedium,
                                  maxLines: 1,
                                  textAlign: TextAlign.start,
                                  lineHeight: 1.33,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w400,
                                ),
                              ],
                              crossAxis: CrossAxis.start,
                              spacing: 4,
                            ),
                          ),
                        ],
                        crossAxis: CrossAxis.start,
                        spacing: 12,
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          right: Constant('mainPadding'),
                        ),
                      ),
                      Row(
                        children: [
                          ConditionalBuilder(
                            children: [
                              PlaceholderWidget(
                                children: [
                                  Container(
                                    child: Icon(
                                      'done_rounded',
                                      size: 20,
                                      color: Color(0xFFFFFFFF),
                                    ),
                                    color: primary,
                                    width: 30,
                                    alignment: Alignment.center,
                                    boxShape: BoxShape.circle,
                                  ),
                                ],
                                visible: timeIndex >= 4,
                              ),
                              PlaceholderWidget(
                                children: [
                                  Container(
                                    child: CirculatIndicatorWhite(
                                      width: 20,
                                      height: 20,
                                    ),
                                    color: primary,
                                    width: 30,
                                    alignment: Alignment.center,
                                    boxShape: BoxShape.circle,
                                  ),
                                ],
                                visible: timeIndex >= 2 && timeIndex < 4,
                              ),
                              PlaceholderWidget(
                                children: [
                                  Container(
                                    child: Icon(
                                      'circle_outlined',
                                      size: 20,
                                      color: lightGray,
                                    ),
                                    color: lightGray,
                                    width: 30,
                                    alignment: Alignment.center,
                                    boxShape: BoxShape.circle,
                                  ),
                                ],
                              ),
                            ],
                          ),
                          Expanded(
                            Column(
                              children: [
                                Text(
                                  'Extracting barcode features',
                                  style: bodyMedium,
                                  color:
                                      (timeIndex >= 2)
                                          ? primaryText
                                          : borderColor,
                                  textAlign: TextAlign.start,
                                  lineHeight: 1.46,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                ),
                                Text(
                                  'Analyzing shape, limb structure, markings, and size...',
                                  style: bodyMedium,
                                  color:
                                      (timeIndex >= 2)
                                          ? primaryText
                                          : borderColor,
                                  maxLines: 1,
                                  textAlign: TextAlign.start,
                                  lineHeight: 1.33,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w400,
                                ),
                              ],
                              crossAxis: CrossAxis.start,
                              spacing: 4,
                            ),
                          ),
                        ],
                        crossAxis: CrossAxis.start,
                        spacing: 12,
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          right: Constant('mainPadding'),
                        ),
                      ),
                      Row(
                        children: [
                          ConditionalBuilder(
                            children: [
                              PlaceholderWidget(
                                children: [
                                  Container(
                                    child: Icon(
                                      'done_rounded',
                                      size: 20,
                                      color: Color(0xFFFFFFFF),
                                    ),
                                    color: primary,
                                    width: 30,
                                    alignment: Alignment.center,
                                    boxShape: BoxShape.circle,
                                  ),
                                ],
                                visible: timeIndex >= 7,
                              ),
                              PlaceholderWidget(
                                children: [
                                  Container(
                                    child: CirculatIndicatorWhite(
                                      width: 20,
                                      height: 20,
                                    ),
                                    color: primary,
                                    width: 30,
                                    alignment: Alignment.center,
                                    boxShape: BoxShape.circle,
                                  ),
                                ],
                                visible: timeIndex >= 5 && timeIndex < 7,
                              ),
                              PlaceholderWidget(
                                children: [
                                  Container(
                                    child: Icon(
                                      'circle_outlined',
                                      size: 20,
                                      color: lightGray,
                                    ),
                                    color: lightGray,
                                    width: 30,
                                    alignment: Alignment.center,
                                    boxShape: BoxShape.circle,
                                  ),
                                ],
                              ),
                            ],
                          ),
                          Expanded(
                            Text(
                              'Detecting barcode',
                              style: bodyMedium,
                              color:
                                  (timeIndex >= 5) ? primaryText : borderColor,
                              textAlign: TextAlign.start,
                              lineHeight: 1.46,
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                        crossAxis: CrossAxis.start,
                        spacing: 12,
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          right: Constant('mainPadding'),
                        ),
                      ),
                      Row(
                        children: [
                          ConditionalBuilder(
                            children: [
                              PlaceholderWidget(
                                children: [
                                  Container(
                                    child: Icon(
                                      'done_rounded',
                                      size: 20,
                                      color: Color(0xFFFFFFFF),
                                    ),
                                    color: primary,
                                    width: 30,
                                    alignment: Alignment.center,
                                    boxShape: BoxShape.circle,
                                  ),
                                ],
                                visible: timeIndex > 9,
                              ),
                              PlaceholderWidget(
                                children: [
                                  Container(
                                    child: CirculatIndicatorWhite(
                                      width: 20,
                                      height: 20,
                                    ),
                                    color: primary,
                                    width: 30,
                                    alignment: Alignment.center,
                                    boxShape: BoxShape.circle,
                                  ),
                                ],
                                visible: timeIndex >= 8 && timeIndex <= 9,
                              ),
                              PlaceholderWidget(
                                children: [
                                  Container(
                                    child: Icon(
                                      'circle_outlined',
                                      size: 20,
                                      color: lightGray,
                                    ),
                                    color: lightGray,
                                    width: 30,
                                    alignment: Alignment.center,
                                    boxShape: BoxShape.circle,
                                  ),
                                ],
                              ),
                            ],
                          ),
                          Expanded(
                            Text(
                              'Preparing identification report',
                              style: bodyMedium,
                              color:
                                  (timeIndex >= 8) ? primaryText : borderColor,
                              textAlign: TextAlign.start,
                              lineHeight: 1.46,
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                        crossAxis: CrossAxis.start,
                        spacing: 12,
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          right: Constant('mainPadding'),
                        ),
                      ),
                    ],
                    crossAxis: CrossAxis.start,
                    spacing: 16,
                  ),
                  borderRadius: 16,
                  borderColor: Color(0x00000000),
                ),
                color: buttonBg,
                borderRadius: 16,
                borderColor: borderColor,
                borderWidth: 1,
                width: double.infinity,
                margin: EdgeInsets.only(
                  left: Constant('mainPadding'),
                  top: 12,
                  right: Constant('mainPadding'),
                  bottom: 24,
                ),
              ),
            ],
          ),
          width: double.infinity,
          height: double.infinity,
          maxWidth: Constant('maxWidth'),
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
    disableAndroidBackButton: true,
  );
}
