@Component()
class HomeComponent {
  int tapIndex = 0;
  String tattooSize;
  String styleName;
  String placementName;
  UploadedFile scanPhoto;
  bool isAiTap = false;
  build() => Container(
    padding: EdgeInsets.only(top: 47),
    child: Column(
      children: [
        Row(
          children: [
            Expanded(
              Column(
                children: [
                  Text(
                    getGreeting(globalProperties.currentTimestamp) ??
                        'Good Morning',
                    style: bodyMedium,
                    maxLines: 1,
                    textAlign: TextAlign.start,
                    lineHeight: 1.46,
                    fontSize: 15,
                  ),
                  RichText(
                    style: bodyMedium,
                    maxLines: 1,
                    spans: [
                      RichTextSpan(
                        'Welcome to Purrbi',
                        fontSize: 18,
                        bold: true,
                        style: bodyMedium,
                        lineHeight: 1.33,
                      ),
                    ],
                    textAlign: TextAlign.start,
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    lineHeight: 1.33,
                  ),
                ],
                crossAxis: CrossAxis.start,
              ),
            ),
            Row(
              children: [
                Container(
                  padding: EdgeInsets.only(left: 8, right: 8),
                  child: Row(
                    children: [
                      Container(
                        child: Icon(
                          IconData('crownyp', custom: true),
                          size: 18,
                          color: primary,
                        ),
                        color: primaryBackground,
                        width: 30,
                        alignment: Alignment.center,
                        boxShape: BoxShape.circle,
                      ),
                      Text(
                        'PREMIUM',
                        style: bodyMedium,
                        color: primary,
                        maxLines: 1,
                        textAlign: TextAlign.start,
                        lineHeight: 1.46,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ],
                    spacing: 5,
                  ),
                  color: primaryLightColor,
                  borderRadius: 24,
                  borderColor: secondary,
                  borderWidth: 1,
                  height: 40,
                  visible: Constant('featurePremium'),
                  onTap: () {
                    context.push(PremiumPage());
                  },
                ),
                Container(
                  child: Icon(
                    IconData('notificationyp', custom: true),
                    color: primary,
                  ),
                  color: primaryLightColor,
                  borderColor: borderColor,
                  borderWidth: 1,
                  width: 40,
                  alignment: Alignment.center,
                  boxShape: BoxShape.circle,
                  visible: Constant('featureNotifications'),
                  onTap: () {
                    context.push(NotificationPage());
                  },
                ),
              ],
              spacing: 12,
            ),
          ],
          mainAxis: MainAxis.spaceBetween,
          spacing: 8,
          padding: EdgeInsets.only(
            left: Constant('mainPadding'),
            top: 24,
            right: Constant('mainPadding'),
            bottom: 7,
          ),
          animations: [
            WidgetAnimation(
              effects: [
                SlideEffect(
                  beginDx: 0,
                  beginDy: -50.0,
                  endDx: 0,
                  endDy: 0,
                  delayMs: 50.0,
                  durationMs: 400.0,
                ),
              ],
              applyInitialState: true,
            ),
          ],
          name: 'AppRow',
        ),
        Expanded(
          ListView(
            children: [
              Container(
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          Column(
                            children: [
                              Container(
                                padding: EdgeInsets.only(
                                  left: 8,
                                  top: 6,
                                  right: 8,
                                  bottom: 6,
                                ),
                                child: Row(
                                  children: [
                                    Icon('pets', size: 18, color: primary),
                                    Expanded(
                                      Text(
                                        'CATS & DOGS',
                                        style: bodyMedium,
                                        color: primary,
                                        maxLines: 1,
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                  spacing: 6,
                                  minSize: MainAxisSize.min,
                                ),
                                color: primaryBackground,
                                borderRadius: 16,
                                borderColor: borderColor,
                              ),
                              Text(
                                'Scan a cat or dog product',
                                style: bodyMedium,
                                color: primaryText,
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                                padding: EdgeInsets.only(top: 8, bottom: 8),
                              ),
                              Text(
                                'Food, treats and supplements: label facts, FDA recall checks and a fit check for your pet.',
                                style: bodyMedium,
                                color: secondaryText,
                                lineHeight: 1.47,
                                fontSize: 15,
                              ),
                            ],
                            crossAxis: CrossAxis.start,
                          ),
                        ),
                        Expanded(
                          Image(
                            'assets/purrbi_logo.png',
                            isNetwork: false,
                            fit: ImageFit.contain,
                            width: 140,
                            height: 140,
                          ),
                        ),
                      ],
                      spacing: 16,
                      padding: EdgeInsets.only(
                        left: 16,
                        top: 16,
                        right: 16,
                        bottom: 19,
                      ),
                    ),
                    Button(
                      'Tap to start scanning',
                      icon: IconSpec(
                        IconData('centerfocusyp', custom: true),
                        size: 24,
                      ),
                      width: double.infinity,
                      height: 56,
                      borderRadius: 999,
                      style: titleSmall,
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      lineHeight: 1,
                      elevation: 0,
                      innerPadding: EdgeInsets.only(left: 20, right: 20),
                      padding: EdgeInsets.only(left: 16, right: 16, bottom: 16),
                      onTap: () {
                        context.push(IdentifierPage());
                      },
                    ),
                  ],
                  mainAxis: MainAxis.center,
                  crossAxis: CrossAxis.start,
                ),
                color: primaryBackground,
                borderRadius: 32,
                borderColor: borderColor,
                margin: EdgeInsets.only(left: 16, right: 16),
              ),
              Container(
                child: Column(
                  children: [
                    Column(
                      children: [
                        Row(
                          children: [
                            Expanded(
                              Container(
                                padding: EdgeInsets.only(
                                  left: 12,
                                  top: 16,
                                  right: 12,
                                  bottom: 16,
                                ),
                                child: Column(
                                  children: [
                                    Container(
                                      child: Icon(
                                        IconData('centerfocusyp', custom: true),
                                        color: primary,
                                      ),
                                      color: primaryLightColor,
                                      width: 40,
                                      alignment: Alignment.center,
                                      boxShape: BoxShape.circle,
                                    ),
                                    Text(
                                      '24',
                                      style: bodyMedium,
                                      textAlign: TextAlign.start,
                                      lineHeight: 1.2,
                                      fontSize: 17,
                                      fontWeight: FontWeight.w600,
                                    ),
                                    Text(
                                      'Results found',
                                      style: bodyMedium,
                                      color: secondaryText,
                                      maxLines: 1,
                                      textAlign: TextAlign.start,
                                      overflow: TextOverflow.ellipsis,
                                      lineHeight: 1.47,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w400,
                                    ),
                                  ],
                                  crossAxis: CrossAxis.start,
                                  spacing: 8,
                                ),
                                color: buttonBg,
                                borderRadius: 16,
                                borderColor: borderColor,
                                borderWidth: 1,
                              ),
                            ),
                            Expanded(
                              Container(
                                padding: EdgeInsets.only(
                                  left: 12,
                                  top: 16,
                                  right: 12,
                                  bottom: 16,
                                ),
                                child: Column(
                                  children: [
                                    Container(
                                      child: Icon(
                                        IconData(
                                          'smartyogaguideyp',
                                          custom: true,
                                        ),
                                        color: primary,
                                      ),
                                      color: primaryLightColor,
                                      width: 40,
                                      alignment: Alignment.center,
                                      boxShape: BoxShape.circle,
                                    ),
                                    Text(
                                      '58',
                                      style: bodyMedium,
                                      textAlign: TextAlign.start,
                                      lineHeight: 1.2,
                                      fontSize: 17,
                                      fontWeight: FontWeight.w600,
                                    ),
                                    Text(
                                      'Total scans',
                                      style: bodyMedium,
                                      color: secondaryText,
                                      maxLines: 1,
                                      textAlign: TextAlign.start,
                                      overflow: TextOverflow.ellipsis,
                                      lineHeight: 1.47,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w400,
                                    ),
                                  ],
                                  crossAxis: CrossAxis.start,
                                  spacing: 8,
                                ),
                                color: buttonBg,
                                borderRadius: 16,
                                borderColor: borderColor,
                                borderWidth: 1,
                              ),
                            ),
                            Expanded(
                              Container(
                                padding: EdgeInsets.only(
                                  left: 12,
                                  top: 16,
                                  right: 12,
                                  bottom: 16,
                                ),
                                child: Column(
                                  children: [
                                    Container(
                                      child: Icon(
                                        IconData('calendaryp', custom: true),
                                        color: primary,
                                      ),
                                      color: primaryLightColor,
                                      width: 40,
                                      alignment: Alignment.center,
                                      boxShape: BoxShape.circle,
                                    ),
                                    Text(
                                      '12',
                                      style: bodyMedium,
                                      textAlign: TextAlign.start,
                                      lineHeight: 1.2,
                                      fontSize: 17,
                                      fontWeight: FontWeight.w600,
                                    ),
                                    Text(
                                      'This month',
                                      style: bodyMedium,
                                      color: secondaryText,
                                      maxLines: 1,
                                      textAlign: TextAlign.start,
                                      overflow: TextOverflow.ellipsis,
                                      lineHeight: 1.38,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w400,
                                    ),
                                  ],
                                  crossAxis: CrossAxis.start,
                                  spacing: 8,
                                ),
                                color: buttonBg,
                                borderRadius: 16,
                                borderColor: borderColor,
                                borderWidth: 1,
                              ),
                            ),
                          ],
                          spacing: 16,
                          startSpacing: Constant('mainPadding'),
                          endSpacing: Constant('mainPadding'),
                        ),
                      ],
                      crossAxis: CrossAxis.start,
                      spacing: 16,
                      visible: Constant('featureTemplateSamples'),
                    ),
                    Column(
                      children: [
                        RowComponent(
                          text: 'Quick actions',
                          isShow: false,
                          viewAllAction: () {
                            context.push(RecentidentifierPage());
                          },
                        ),
                        Row(
                          children: [
                            Expanded(
                              Container(
                                padding: EdgeInsets.all(12),
                                child: Column(
                                  children: [
                                    Container(
                                      child: Icon(
                                        IconData('centerfocusyp', custom: true),
                                        size: 20,
                                        color: primary,
                                      ),
                                      color: primaryLightColor,
                                      width: 40,
                                      alignment: Alignment.center,
                                      boxShape: BoxShape.circle,
                                    ),
                                    Text(
                                      'Scan now',
                                      style: bodyMedium,
                                      maxLines: 1,
                                      textAlign: TextAlign.start,
                                      overflow: TextOverflow.ellipsis,
                                      lineHeight: 1.33,
                                      fontSize: 18,
                                      fontWeight: FontWeight.w600,
                                      padding: EdgeInsets.only(
                                        top: 8,
                                        bottom: 4,
                                      ),
                                    ),
                                    Text(
                                      'Barcode or label photo',
                                      style: bodyMedium,
                                      color: secondaryText,
                                      maxLines: 1,
                                      textAlign: TextAlign.start,
                                      overflow: TextOverflow.ellipsis,
                                      lineHeight: 1.47,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w400,
                                    ),
                                  ],
                                  crossAxis: CrossAxis.start,
                                ),
                                color: buttonBg,
                                borderRadius: 16,
                                borderColor: borderColor,
                                borderWidth: 1,
                                onTap: () {
                                  context.push(IdentifierPage());
                                },
                              ),
                            ),
                            Expanded(
                              Container(
                                padding: EdgeInsets.all(12),
                                child: Column(
                                  children: [
                                    Container(
                                      child: Icon(
                                        IconData('scanhistoryyp', custom: true),
                                        size: 20,
                                        color: primary,
                                      ),
                                      color: primaryLightColor,
                                      width: 40,
                                      alignment: Alignment.center,
                                      boxShape: BoxShape.circle,
                                    ),
                                    Text(
                                      'Scan history',
                                      style: bodyMedium,
                                      textAlign: TextAlign.start,
                                      lineHeight: 1.33,
                                      fontSize: 18,
                                      fontWeight: FontWeight.w600,
                                      padding: EdgeInsets.only(
                                        top: 8,
                                        bottom: 4,
                                      ),
                                    ),
                                    Text(
                                      'Your saved results',
                                      style: bodyMedium,
                                      color: secondaryText,
                                      textAlign: TextAlign.start,
                                      lineHeight: 1.47,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w400,
                                    ),
                                  ],
                                  crossAxis: CrossAxis.start,
                                ),
                                color: buttonBg,
                                borderRadius: 16,
                                borderColor: borderColor,
                                borderWidth: 1,
                                onTap: () {
                                  appState.homePageIndex = 2;
                                },
                              ),
                            ),
                          ],
                          spacing: 16,
                          startSpacing: 16,
                          endSpacing: 16,
                        ),
                      ],
                      spacing: 16,
                      padding: EdgeInsets.only(top: 16),
                    ),
                  ],
                ),
                name: 'CollectionStats',
              ),
              Container(
                child: Container(
                  child: Column(
                    children: [
                      RowComponent(
                        text: 'Recent identify',
                        isShow: true,
                        viewAllAction: () {
                          context.push(RecentidentifierPage());
                        },
                      ),
                      Column(
                        children: [
                          RecentIdentifier(
                            detail: ItemRef(),
                            uniqueKey: ItemRef().index,
                            padding: EdgeInsets.only(
                              left: 8,
                              top: 8,
                              right: 8,
                              bottom: 8,
                            ),
                            onTapAction: () {
                              context.push(
                                ResultDetailsPage(
                                  images: ItemRef().img,
                                  title: ItemRef().title,
                                ),
                              );
                            },
                          ),
                        ],
                        padding: EdgeInsets.only(top: 8),
                      ),
                      RowComponent(
                        text: 'Blog',
                        isShow: true,
                        padding: EdgeInsets.only(bottom: 16),
                        viewAllAction: () {
                          context.push(BlogPage());
                        },
                      ),
                      Row(
                        children: [
                          BlogComponent(
                            detail: ItemRef(),
                            width: 284.0,
                            uniqueKey: ItemRef().name,
                            onTapAction: () {
                              context.push(
                                BlolgDetailPage(blogDetail: ItemRef()),
                              );
                            },
                          ),
                        ],
                        spacing: 16,
                        scrollable: true,
                        minSize: MainAxisSize.min,
                        startSpacing: 16,
                        endSpacing: 16,
                      ),
                    ],
                    crossAxis: CrossAxis.start,
                  ),
                ),
                visible: Constant('featureTemplateSamples'),
                name: 'GetInspired',
              ),
            ],
            spacing: 16,
            primary: true,
            startSpacing: 7,
            endSpacing: 24,
          ),
        ),
      ],
      crossAxis: CrossAxis.start,
    ),
    color: Color(0x00000000),
  );
}
