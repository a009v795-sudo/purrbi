@Page(route: '/')
class IdentifierPage {
  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Column(
            children: [
              MainAppbar(
                title: ' Identifier',
                isBack: true,
                isEdit: false,
                isShare: false,
                backAction: () {
                  appState.homePageIndex = 0;
                  context.push(HomeMainPage(), allowBack: false);
                },
              ),
              Expanded(
                Column(
                  children: [
                    Expanded(
                      Container(
                        padding: EdgeInsets.only(left: 16, right: 16),
                        child: Container(
                          padding: EdgeInsets.all(24),
                          child: Column(
                            children: [
                              Container(
                                padding: EdgeInsets.only(
                                  left: 12,
                                  top: 6,
                                  right: 12,
                                  bottom: 6,
                                ),
                                child: Row(
                                  children: [
                                    Icon(
                                      IconData('sparkleyp', custom: true),
                                      color: Color(0xFFFFFFFF),
                                    ),
                                    Text(
                                      'PREMIUM AI',
                                      style: bodyMedium,
                                      color: Color(0xFFFFFFFF),
                                      maxLines: 1,
                                      textAlign: TextAlign.start,
                                      lineHeight: 1.38,
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ],
                                  spacing: 6,
                                  minSize: MainAxisSize.min,
                                ),
                                color: primary,
                                borderRadius: 60,
                              ),
                              Text(
                                'Whose barcode is this?',
                                style: bodyMedium,
                                color: Color(0xFFFFFFFF),
                                maxLines: 1,
                                textAlign: TextAlign.start,
                                lineHeight: 1.25,
                                fontSize: 24,
                                fontWeight: FontWeight.w600,
                                autoSize: true,
                                padding: EdgeInsets.only(top: 16, bottom: 8),
                              ),
                              Text(
                                'Scan a barcode and identify the animal \ninstantly with AI',
                                style: bodyMedium,
                                color: Color(0xFFFFFFFF),
                                maxLines: 2,
                                textAlign: TextAlign.start,
                                lineHeight: 1.46,
                                fontSize: 15,
                                fontWeight: FontWeight.w400,
                                autoSize: true,
                              ),
                            ],
                            mainAxis: MainAxis.end,
                            crossAxis: CrossAxis.start,
                          ),
                          borderRadius: 24,
                          margin: EdgeInsets.only(left: 16, right: 16),
                          image: DecorationImage(
                            path:
                                'projects/a-i-barcode-identifier-app-ahbvz7/assets/a0eblbmlfm1t/sanner-image_.png',
                            type: ImageType.asset,
                          ),
                        ),
                        width: double.infinity,
                        height: double.infinity,
                      ),
                    ),
                    Row(
                      children: [
                        Expanded(
                          Container(
                            padding: EdgeInsets.all(16),
                            child: Column(
                              children: [
                                Icon(
                                  IconData('galleryyp', custom: true),
                                  size: 30,
                                  color: iconColor,
                                ),
                                Text(
                                  'Gallery',
                                  style: bodyMedium,
                                  textAlign: TextAlign.center,
                                  lineHeight: 1.47,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                ),
                              ],
                              spacing: 8,
                            ),
                            color: buttonBg,
                            borderRadius: 24,
                            borderColor: borderColor,
                            borderWidth: 1,
                            onTap: () {
                              if (appState.isAdsTap >= 3) {
                                if (!globalProperties.isWeb) {
                                  actions.initAds();
                                  actions.rewardedInterstitialAds(
                                    callback: () {
                                      appState.isAdsTap -= 1;
                                    },
                                  );
                                } else {
                                  mainSanckbar(title: 'Please buy premium');
                                }
                              } else {
                                UploadData(
                                  actionName: 'UploadData_gallery',
                                  maxWidth: 1000,
                                  maxHeight: 1000,
                                  showSnackBar: false,
                                  key: 'prjy526g',
                                );
                                if (Bound('92a29c9d', 'widgetState').isSet) {
                                  context.push(
                                    AnalysisResultPage(
                                      imageUpload: ActionResult.uploadedFile(
                                        'prjy526g',
                                      ),
                                      scanType: '',
                                    ),
                                  );
                                }
                              }
                            },
                          ),
                        ),
                        Column(
                          children: [
                            Container(
                              child: Icon(
                                'camera_alt',
                                size: 40,
                                color: Color(0xFFFFFFFF),
                              ),
                              color: primary,
                              width: 84.57,
                              alignment: Alignment.center,
                              boxShape: BoxShape.circle,
                              onTap: () {
                                if (!globalProperties.isWeb) {
                                  if (appState.isAdsTap >= 3) {
                                    actions.initAds();
                                    actions.rewardedInterstitialAds(
                                      callback: () {
                                        appState.isAdsTap -= 1;
                                      },
                                    );
                                  } else {
                                    UploadData(
                                      source: UploadSource.camera,
                                      actionName: 'UploadData_Camera',
                                      maxWidth: 1000,
                                      maxHeight: 1000,
                                      showSnackBar: false,
                                      key: 'j926prgw',
                                    );
                                    if (Bound(
                                      '194d8eee',
                                      'widgetState',
                                    ).isSet) {
                                      context.push(
                                        AnalysisResultPage(
                                          imageUpload:
                                              ActionResult.uploadedFile(
                                                'j926prgw',
                                              ),
                                          scanType: '',
                                        ),
                                      );
                                    }
                                  }
                                } else {
                                  mainSanckbar(
                                    title:
                                        'Camera is not supported on the web.',
                                    shouldSetState: true,
                                  );
                                }
                              },
                            ),
                            Text(
                              'TAP TO SCAN',
                              style: bodyMedium,
                              textAlign: TextAlign.center,
                              lineHeight: 1.47,
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                            ),
                          ],
                          spacing: 12,
                        ),
                        Expanded(
                          Container(
                            padding: EdgeInsets.all(16),
                            child: Column(
                              children: [
                                Icon(
                                  IconData('tipsyp', custom: true),
                                  size: 30,
                                  color: iconColor,
                                ),
                                Text(
                                  'Tips',
                                  style: bodyMedium,
                                  textAlign: TextAlign.center,
                                  lineHeight: 1.47,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                ),
                              ],
                              spacing: 8,
                            ),
                            color: buttonBg,
                            borderRadius: 24,
                            borderColor: borderColor,
                            borderWidth: 1,
                            onTap: () {
                              ShowBottomSheet(
                                TipsBottomComponent(),
                                backgroundColor: Color(0x00000000),
                                enableDrag: false,
                              );
                            },
                          ),
                        ),
                      ],
                      mainAxis: MainAxis.spaceBetween,
                      crossAxis: CrossAxis.end,
                      spacing: 20,
                      padding: EdgeInsets.only(
                        left: Constant('mainPadding'),
                        right: Constant('mainPadding'),
                      ),
                    ),
                    Container(
                      child: Column(
                        children: [
                          Row(
                            children: [
                              Container(
                                child: Icon(
                                  IconData('tipsyp', custom: true),
                                  size: 20,
                                  color: primary,
                                ),
                                color: primaryLightColor,
                                width: 38,
                                alignment: Alignment.center,
                                boxShape: BoxShape.circle,
                              ),
                              Text(
                                'Pro tips',
                                style: bodyMedium,
                                color: primary,
                                textAlign: TextAlign.start,
                                lineHeight: 1.33,
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                              ),
                            ],
                            spacing: 12,
                            padding: EdgeInsets.all(12),
                          ),
                          Row(
                            children: [
                              Container(
                                color: secondaryText,
                                width: 6,
                                margin: EdgeInsets.only(top: 6),
                                boxShape: BoxShape.circle,
                              ),
                              Expanded(
                                Text(
                                  'Use natural daylight and avoid blurry or shadowed images.',
                                  style: bodyMedium,
                                  color: secondaryText,
                                ),
                              ),
                            ],
                            crossAxis: CrossAxis.start,
                            spacing: 16,
                            padding: EdgeInsets.only(left: 16, right: 16),
                          ),
                          Row(
                            children: [
                              Container(
                                color: secondaryText,
                                width: 6,
                                margin: EdgeInsets.only(top: 6),
                                boxShape: BoxShape.circle,
                              ),
                              Expanded(
                                Text(
                                  'Capture the entire barcode clearly for the most accurate identification.',
                                  style: bodyMedium,
                                  color: secondaryText,
                                ),
                              ),
                            ],
                            crossAxis: CrossAxis.start,
                            spacing: 16,
                            padding: EdgeInsets.only(
                              left: 16,
                              top: 10,
                              right: 16,
                              bottom: 16,
                            ),
                          ),
                        ],
                      ),
                      color: buttonBg,
                      borderRadius: 16,
                      borderColor: borderColor,
                      borderWidth: 1,
                      margin: EdgeInsets.only(
                        left: Constant('mainPadding'),
                        right: Constant('mainPadding'),
                      ),
                    ),
                  ],
                  spacing: 16,
                  startSpacing: 16,
                  endSpacing: 24,
                ),
              ),
            ],
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
      ),
      width: double.infinity,
      height: double.infinity,
      alignment: Alignment.topCenter,
    ),
    backgroundColor: bgColor,
    safeArea: false,
  );
}
