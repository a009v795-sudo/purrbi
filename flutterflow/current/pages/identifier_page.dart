@Page(route: '/')
class IdentifierPage {
  String lastScan = '';
  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Column(
            children: [
              MainAppbar(
                title: 'Scan',
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
                                      'BARCODE FIRST',
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
                                'Scan the barcode',
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
                                'Cat and dog foods, treats and supplements.\nIf details are missing, Purrbi asks for a label photo.',
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
                                  BarcodeScanner(outputAs: 'scannedCode');
                                  lastScan = scannedCode;
                                  if (!(isLikelyBarcode(lastScan))) {
                                    snackBar('No barcode was read. Try again, holding the code steady in the frame.');
                                  } else {
                                    ShowDialog.message(
                                      title: 'Barcode read',
                                      message:
                                          'Purrbi read $lastScan. The product lookup switches on once Purrbi\'s backend is connected.',
                                      dismissText: 'OK',
                                    );
                                  }
                                } else {
                                  mainSanckbar(
                                    title:
                                        'Scanning needs the Android or iOS app.',
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
                      ],
                      mainAxis: MainAxis.center,
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
                                  'Fit the whole barcode in the frame and hold steady until it is read.',
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
