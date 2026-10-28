@Page(route: '/')
class ReviewSummaryPage {
  final int paymentIndex;
  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Column(
            children: [
              MainAppbar(
                title: 'Review summary',
                isBack: false,
                isEdit: false,
                isShare: false,
              ),
              Expanded(
                ListView(
                  children: [
                    Container(
                      padding: EdgeInsets.all(16),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              Expanded(
                                Column(
                                  children: [
                                    Text(
                                      'Yearly plan',
                                      style: bodyMedium,
                                      maxLines: 1,
                                      textAlign: TextAlign.start,
                                      lineHeight: 1.3,
                                      fontSize: 20,
                                      fontWeight: FontWeight.w600,
                                    ),
                                    Text(
                                      '\$80.00/year',
                                      style: bodyMedium,
                                      color: secondaryText,
                                      textAlign: TextAlign.start,
                                      lineHeight: 1.52,
                                      fontSize: 17,
                                      fontWeight: FontWeight.w400,
                                      strikethrough: true,
                                    ),
                                  ],
                                  crossAxis: CrossAxis.start,
                                  spacing: 8,
                                ),
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
                                  lineHeight: 1.38,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                                color: primary,
                                borderRadius: 20,
                              ),
                            ],
                            mainAxis: MainAxis.spaceBetween,
                            crossAxis: CrossAxis.start,
                            spacing: 4,
                            padding: EdgeInsets.only(bottom: 4),
                          ),
                          RichText(
                            style: bodyMedium,
                            spans: [
                              RichTextSpan(
                                '${appState.currencyType}40.00',
                                fontSize: 28,
                                style: bodyMedium,
                                fontWeight: FontWeight.w700,
                                lineHeight: 1.21,
                              ),
                              RichTextSpan(
                                ' / ',
                                color: secondaryText,
                                fontSize: 20,
                                style: bodyMedium,
                                fontWeight: FontWeight.w500,
                                lineHeight: 1.2,
                              ),
                              RichTextSpan(
                                'year',
                                color: secondaryText,
                                fontSize: 20,
                                style: bodyMedium,
                                fontWeight: FontWeight.w500,
                                lineHeight: 1.2,
                              ),
                            ],
                            textAlign: TextAlign.start,
                            padding: EdgeInsets.only(top: 12),
                          ),
                          Column(
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
                                      lineHeight: 1.52,
                                      fontSize: 17,
                                      fontWeight: FontWeight.w400,
                                    ),
                                  ),
                                ],
                                crossAxis: CrossAxis.start,
                                spacing: 8,
                                padding: EdgeInsets.only(top: 16),
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
                                      'No ads',
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
                            spacing: 10,
                          ),
                        ],
                        crossAxis: CrossAxis.start,
                      ),
                      color: buttonBg,
                      borderRadius: 12,
                      borderColor: borderColor,
                      borderWidth: 1,
                      width: double.infinity,
                      margin: EdgeInsets.only(
                        left: Constant('mainPadding'),
                        right: Constant('mainPadding'),
                      ),
                    ),
                    Text(
                      'Select payment method',
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
                      child: Row(
                        children: [
                          ConditionalBuilder(
                            children: [
                              PlaceholderWidget(
                                children: [
                                  Image(
                                    'projects/dog-scan-a-i-4k1iqf/assets/lcdtnyuvky4z/stripe.svg',
                                    isNetwork: false,
                                    fit: ImageFit.contain,
                                    width: 34,
                                    height: 34,
                                    borderRadius: 0,
                                    format: ImageFormat.svg,
                                  ),
                                ],
                                visible: paymentIndex == 0,
                              ),
                              PlaceholderWidget(
                                children: [
                                  Image(
                                    'projects/dog-scan-a-i-4k1iqf/assets/kxh95mm3e4ly/razor_pay.svg',
                                    isNetwork: false,
                                    fit: ImageFit.contain,
                                    width: 34,
                                    height: 34,
                                    borderRadius: 0,
                                    format: ImageFormat.svg,
                                  ),
                                ],
                                visible: paymentIndex == 1,
                              ),
                              PlaceholderWidget(
                                children: [
                                  Image(
                                    'projects/dog-scan-a-i-4k1iqf/assets/0wzesqnlkhr8/paypal.svg',
                                    isNetwork: false,
                                    fit: ImageFit.contain,
                                    width: 34,
                                    height: 34,
                                    borderRadius: 0,
                                    format: ImageFormat.svg,
                                  ),
                                ],
                              ),
                            ],
                          ),
                          Expanded(
                            Text(
                              (paymentIndex == 0)
                                  ? 'Stripe'
                                  : (paymentIndex == 1)
                                  ? 'Razor pay'
                                  : 'Paypal',
                              style: bodyMedium,
                              maxLines: 1,
                              textAlign: TextAlign.start,
                              overflow: TextOverflow.ellipsis,
                              lineHeight: 1.33,
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Text(
                            'Change',
                            style: bodyMedium,
                            color: primary,
                            maxLines: 1,
                            textAlign: TextAlign.end,
                            overflow: TextOverflow.ellipsis,
                            lineHeight: 1.33,
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            onTap: () {
                              context.safePop();
                            },
                          ),
                        ],
                        spacing: 16,
                      ),
                      color: buttonBg,
                      borderRadius: 12,
                      borderColor: borderColor,
                      borderWidth: 1,
                      width: double.infinity,
                      margin: EdgeInsets.only(
                        left: Constant('mainPadding'),
                        right: Constant('mainPadding'),
                      ),
                    ),
                  ],
                  spacing: 16,
                  primary: true,
                  startSpacing: 16,
                  endSpacing: 12,
                ),
              ),
              Button(
                'Checkout',
                width: double.infinity,
                height: 56,
                borderRadius: 16,
                style: titleSmall,
                fontSize: 18,
                fontWeight: FontWeight.w600,
                lineHeight: 1,
                elevation: 0,
                innerPadding: EdgeInsets.only(left: 20, right: 20),
                iconPosition: ButtonIconPosition.leading,
                padding: EdgeInsets.only(
                  left: Constant('mainPadding'),
                  top: 12,
                  right: Constant('mainPadding'),
                  bottom: 24,
                ),
                onTap: () {
                  if (appState.connected) {
                    Wait(1000);
                    ShowBottomSheet(
                      ProcessingPaymentComponent(),
                      backgroundColor: Color(0x00000000),
                      enableDrag: false,
                    );
                    SetState.batch([
                      appState.isPro = true,
                      appState.isAdsTap = 0,
                    ]);
                    ShowBottomSheet(
                      PremiumBuySuccessDialog(
                        onTapOk: () {
                          context.push(HomeMainPage(), allowBack: false);
                        },
                      ),
                      backgroundColor: Color(0x00000000),
                      enableDrag: false,
                    );
                  } else {
                    internetSnackbar();
                  }
                },
              ),
              RichText(
                style: bodyMedium,
                spans: [
                  RichTextSpan(
                    'Total charged today:  ',
                    color: secondaryText,
                    fontSize: 13,
                    style: bodyMedium,
                    lineHeight: 1.31,
                  ),
                  RichTextSpan(
                    '${appState.currencyType}40.00',
                    color: primary,
                    fontSize: 13,
                    bold: true,
                    style: bodyMedium,
                    lineHeight: 1.31,
                  ),
                  RichTextSpan(
                    ' | Billed annually · Cancel anytime',
                    color: secondaryText,
                    fontSize: 13,
                    style: bodyMedium,
                    lineHeight: 1.31,
                  ),
                ],
                textAlign: TextAlign.center,
                fontSize: 13,
                padding: EdgeInsets.only(
                  left: Constant('mainPadding'),
                  right: Constant('mainPadding'),
                  bottom: 24,
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
