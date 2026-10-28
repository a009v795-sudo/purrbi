@Page(route: '/')
class PaymentMethodPage {
  int paymentIndex;
  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Column(
            children: [
              MainAppbar(
                title: 'Select payment method',
                isBack: false,
                isEdit: false,
                isShare: false,
              ),
              Expanded(
                ListView(
                  children: [
                    Text(
                      'Choose an option to pay',
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
                    Text(
                      'You will able to review all the things in next page',
                      style: bodyMedium,
                      color: secondaryText,
                      textAlign: TextAlign.start,
                      lineHeight: 1.46,
                      fontSize: 15,
                      fontWeight: FontWeight.w400,
                      padding: EdgeInsets.only(
                        left: Constant('mainPadding'),
                        top: 8,
                        right: Constant('mainPadding'),
                        bottom: 8,
                      ),
                    ),
                    Container(
                      padding: EdgeInsets.all(16),
                      child: Row(
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
                          Expanded(
                            Text(
                              'Stripe',
                              style: bodyMedium,
                              maxLines: 1,
                              textAlign: TextAlign.start,
                              overflow: TextOverflow.ellipsis,
                              lineHeight: 1.52,
                              fontSize: 17,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          ConditionalBuilder(
                            children: [
                              PlaceholderWidget(
                                children: [
                                  Icon(
                                    'radio_button_checked_rounded',
                                    color: primary,
                                  ),
                                ],
                                visible: paymentIndex == 0,
                              ),
                              PlaceholderWidget(
                                children: [
                                  Icon(
                                    'radio_button_off_rounded',
                                    color: iconColor,
                                  ),
                                ],
                              ),
                            ],
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
                        top: 16,
                        right: Constant('mainPadding'),
                        bottom: 16,
                      ),
                      onTap: () {
                        paymentIndex = 0;
                      },
                    ),
                    Container(
                      padding: EdgeInsets.all(16),
                      child: Row(
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
                          Expanded(
                            Text(
                              'Razor pay',
                              style: bodyMedium,
                              maxLines: 1,
                              textAlign: TextAlign.start,
                              overflow: TextOverflow.ellipsis,
                              lineHeight: 1.52,
                              fontSize: 17,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          ConditionalBuilder(
                            children: [
                              PlaceholderWidget(
                                children: [
                                  Icon(
                                    'radio_button_checked_rounded',
                                    color: primary,
                                  ),
                                ],
                                visible: paymentIndex == 1,
                              ),
                              PlaceholderWidget(
                                children: [
                                  Icon(
                                    'radio_button_off_rounded',
                                    color: iconColor,
                                  ),
                                ],
                              ),
                            ],
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
                        bottom: 16,
                      ),
                      onTap: () {
                        paymentIndex = 1;
                      },
                    ),
                    Container(
                      padding: EdgeInsets.all(16),
                      child: Row(
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
                          Expanded(
                            Text(
                              'Paypal',
                              style: bodyMedium,
                              maxLines: 1,
                              textAlign: TextAlign.start,
                              overflow: TextOverflow.ellipsis,
                              lineHeight: 1.52,
                              fontSize: 17,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          ConditionalBuilder(
                            children: [
                              PlaceholderWidget(
                                children: [
                                  Icon(
                                    'radio_button_checked_rounded',
                                    color: primary,
                                  ),
                                ],
                                visible: paymentIndex == 2,
                              ),
                              PlaceholderWidget(
                                children: [
                                  Icon(
                                    'radio_button_off_rounded',
                                    color: iconColor,
                                  ),
                                ],
                              ),
                            ],
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
                      onTap: () {
                        paymentIndex = 2;
                      },
                    ),
                  ],
                  primary: true,
                  startSpacing: 16,
                  endSpacing: 12,
                ),
              ),
              Button(
                'Continue',
                width: double.infinity,
                height: 56,
                borderRadius: 16,
                disabled: !paymentIndex.isSet,
                style: titleSmall,
                fontSize: 18,
                fontWeight: FontWeight.w600,
                lineHeight: 1,
                elevation: 0,
                innerPadding: EdgeInsets.only(left: 20, right: 20),
                disabledColor: disableButton,
                disabledTextColor: secondaryText,
                padding: EdgeInsets.only(
                  left: Constant('mainPadding'),
                  top: 12,
                  right: Constant('mainPadding'),
                  bottom: 16,
                ),
                onTap: () {
                  if (appState.connected) {
                    context.push(ReviewSummaryPage(paymentIndex: paymentIndex));
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
