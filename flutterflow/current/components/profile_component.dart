@Component()
class ProfileComponent {
  build() => Container(
    child: Column(
      children: [
        CenterAppbar(title: 'Profile', padding: EdgeInsets.only(top: 47)),
        Expanded(
          ListView(
            children: [
              Column(
                children: [
                  Row(
                    children: [
                      CircleImage(
                        'assets/purrbi_logo.png',
                        isNetwork: false,
                        width: 70,
                      ),
                      Expanded(
                        Column(
                          children: [
                            Text(
                              '${appState.userDetail.firstName} ${appState.userDetail.lastName}',
                              style: bodyMedium,
                              maxLines: 1,
                              textAlign: TextAlign.start,
                              overflow: TextOverflow.ellipsis,
                              lineHeight: 1.2,
                              fontSize: 20,
                              fontWeight: FontWeight.w600,
                            ),
                            Text(
                              appState.userDetail.email,
                              style: bodyMedium,
                              color: primaryText,
                              maxLines: 1,
                              textAlign: TextAlign.start,
                              overflow: TextOverflow.ellipsis,
                              lineHeight: 1.29,
                              fontSize: 17,
                              fontWeight: FontWeight.w400,
                            ),
                          ],
                          crossAxis: CrossAxis.start,
                          spacing: 4,
                        ),
                      ),
                    ],
                    spacing: 10,
                    padding: EdgeInsets.only(
                      left: Constant('mainPadding'),
                      right: Constant('mainPadding'),
                    ),
                  ),
                  Text(
                    'Member since march 2026',
                    style: bodyMedium,
                    color: secondaryText,
                    textAlign: TextAlign.start,
                    lineHeight: 1.28,
                    fontSize: 18,
                    fontWeight: FontWeight.w500,
                    visible: Constant('featureTemplateSamples'),
                    padding: EdgeInsets.only(
                      left: Constant('mainPadding'),
                      right: Constant('mainPadding'),
                    ),
                  ),
                ],
                crossAxis: CrossAxis.start,
                spacing: 8,
              ),
              ConditionalBuilder(
                children: [
                  PlaceholderWidget(
                    children: [
                      Column(
                        children: [
                          Text(
                            'Subscription',
                            style: bodyMedium,
                            textAlign: TextAlign.start,
                            lineHeight: 1.28,
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
                                Expanded(
                                  Row(
                                    children: [
                                      Container(
                                        child: Icon(
                                          IconData(
                                            'membershipyp',
                                            custom: true,
                                          ),
                                          size: 22,
                                          color: primary,
                                        ),
                                        color: Color(0xFFFFFFFF),
                                        width: 38,
                                        alignment: Alignment.center,
                                        boxShape: BoxShape.circle,
                                      ),
                                      Expanded(
                                        Text(
                                          'Membership',
                                          style: bodyMedium,
                                          color: Color(0xFFFFFFFF),
                                          maxLines: 1,
                                          textAlign: TextAlign.start,
                                          overflow: TextOverflow.ellipsis,
                                          lineHeight: 1.29,
                                          fontSize: 17,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ],
                                    spacing: 12,
                                  ),
                                ),
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
                                        IconData('crownyp', custom: true),
                                        size: 22,
                                        color: primary,
                                      ),
                                      Text(
                                        'Yearly plan',
                                        style: bodyMedium,
                                        color: primary,
                                        maxLines: 1,
                                        textAlign: TextAlign.start,
                                        lineHeight: 1.33,
                                        fontSize: 15,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ],
                                    spacing: 4,
                                  ),
                                  color: Color(0xFFFFFFFF),
                                  borderRadius: 12,
                                  alignment: Alignment.center,
                                ),
                              ],
                              mainAxis: MainAxis.spaceBetween,
                              crossAxis: CrossAxis.start,
                              spacing: 8,
                            ),
                            color: primary,
                            borderRadius: 16,
                            width: double.infinity,
                            margin: EdgeInsets.only(
                              left: Constant('mainPadding'),
                              right: Constant('mainPadding'),
                            ),
                            onTap: () {
                              context.push(MySubscriptionPage());
                            },
                          ),
                        ],
                        crossAxis: CrossAxis.start,
                        spacing: 16,
                        name: 'SubscriptionColumn',
                      ),
                    ],
                    visible: appState.isPro,
                  ),
                  PlaceholderWidget(
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
                                      Row(
                                        children: [
                                          Icon(
                                            IconData('crownyp', custom: true),
                                            color: Color(0xFFFFFFFF),
                                          ),
                                          Expanded(
                                            Text(
                                              'PREMIUM PLAN',
                                              style: bodyMedium,
                                              color: Color(0xFFFFFFFF),
                                              maxLines: 1,
                                              textAlign: TextAlign.start,
                                              overflow: TextOverflow.ellipsis,
                                              lineHeight: 1.31,
                                              fontSize: 13,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                        ],
                                        mainAxis: MainAxis.spaceBetween,
                                        spacing: 8,
                                      ),
                                      Text(
                                        'Unlock unlimited premium features',
                                        style: bodyMedium,
                                        color: Color(0xFFFFFFFF),
                                        maxLines: 1,
                                        textAlign: TextAlign.start,
                                        overflow: TextOverflow.ellipsis,
                                        lineHeight: 1.28,
                                        fontSize: 18,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ],
                                    crossAxis: CrossAxis.start,
                                    spacing: 8,
                                  ),
                                ),
                                Container(
                                  padding: EdgeInsets.only(
                                    left: 16,
                                    top: 6,
                                    right: 16,
                                    bottom: 6,
                                  ),
                                  child: Text(
                                    'Upgrade',
                                    style: bodyMedium,
                                    color: primary,
                                    textAlign: TextAlign.start,
                                    lineHeight: 1.33,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w600,
                                  ),
                                  color: primaryLightColor,
                                  borderRadius: 12,
                                ),
                              ],
                              mainAxis: MainAxis.spaceBetween,
                              crossAxis: CrossAxis.start,
                              spacing: 2,
                            ),
                            Text(
                              'Unlimited access, exclusive tools, & ad-free experience',
                              style: bodyMedium,
                              color: Color(0xFFFFFFFF),
                              textAlign: TextAlign.start,
                              lineHeight: 1.29,
                              fontSize: 14,
                              fontWeight: FontWeight.w400,
                            ),
                          ],
                          crossAxis: CrossAxis.start,
                          spacing: 8,
                        ),
                        color: primary,
                        borderRadius: 16,
                        width: double.infinity,
                        margin: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          right: Constant('mainPadding'),
                        ),
                        onTap: () {
                          if (appState.connected) {
                            context.push(PremiumPage());
                          } else {
                            internetSnackbar(shouldSetState: true);
                          }
                        },
                      ),
                    ],
                  ),
                ],
                visible: Constant('featurePremium'),
              ),
              Column(
                children: [
                  Text(
                    'Account',
                    style: bodyMedium,
                    textAlign: TextAlign.start,
                    lineHeight: 1.28,
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
                            Container(
                              child: Icon(
                                IconData('profileuyp', custom: true),
                                size: 20,
                                color: primary,
                              ),
                              color: primaryLightColor,
                              width: 38,
                              alignment: Alignment.center,
                              boxShape: BoxShape.circle,
                            ),
                            Expanded(
                              Text(
                                'My profile',
                                style: bodyMedium,
                                maxLines: 1,
                                textAlign: TextAlign.start,
                                overflow: TextOverflow.ellipsis,
                                lineHeight: 1.29,
                                fontSize: 17,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                            Icon(
                              IconData('arrowrightyp', custom: true),
                              size: 20,
                              color: iconColor,
                            ),
                          ],
                          spacing: 12,
                          onTap: () {
                            context.push(MyProfilePage());
                          },
                        ),
                        Container(
                          color: borderColor,
                          width: double.infinity,
                          height: 1,
                        ),
                        Row(
                          children: [
                            Container(
                              child: Icon(
                                IconData('crownyp', custom: true),
                                size: 20,
                                color: primary,
                              ),
                              color: primaryLightColor,
                              width: 38,
                              alignment: Alignment.center,
                              boxShape: BoxShape.circle,
                            ),
                            Expanded(
                              Text(
                                'My subscription',
                                style: bodyMedium,
                                maxLines: 1,
                                textAlign: TextAlign.start,
                                overflow: TextOverflow.ellipsis,
                                lineHeight: 1.29,
                                fontSize: 17,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                            Icon(
                              IconData('arrowrightyp', custom: true),
                              size: 20,
                              color: iconColor,
                            ),
                          ],
                          spacing: 12,
                          visible: Constant('featurePremium'),
                          onTap: () {
                            if (appState.isPro) {
                              context.push(MySubscriptionPage());
                            } else {
                              context.push(MyEmptySubscriptionPage());
                            }
                          },
                        ),
                        Container(
                          color: borderColor,
                          width: double.infinity,
                          height: 1,
                          visible: Constant('featurePremium'),
                        ),
                        Row(
                          children: [
                            Container(
                              child: Icon(
                                IconData('changepasswordyp', custom: true),
                                size: 20,
                                color: primary,
                              ),
                              color: primaryLightColor,
                              width: 38,
                              alignment: Alignment.center,
                              boxShape: BoxShape.circle,
                            ),
                            Expanded(
                              Text(
                                'Change password',
                                style: bodyMedium,
                                maxLines: 1,
                                textAlign: TextAlign.start,
                                overflow: TextOverflow.ellipsis,
                                lineHeight: 1.29,
                                fontSize: 17,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                            Icon(
                              IconData('arrowrightyp', custom: true),
                              size: 20,
                              color: iconColor,
                            ),
                          ],
                          spacing: 12,
                          onTap: () {
                            context.push(ChangePasswordPage());
                          },
                        ),
                      ],
                      crossAxis: CrossAxis.start,
                      spacing: 16,
                    ),
                    color: buttonBg,
                    borderRadius: Constant('radius2Xl'),
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
                animations: [
                  WidgetAnimation(
                    effects: [
                      SlideEffect(
                        beginDx: -100.0,
                        beginDy: 0,
                        endDx: 0,
                        endDy: 0,
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
                name: 'AccountColumn',
              ),
              Column(
                children: [
                  Text(
                    'Discover',
                    style: bodyMedium,
                    textAlign: TextAlign.start,
                    lineHeight: 1.28,
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
                            Container(
                              child: Icon(
                                IconData('favoriteuyp', custom: true),
                                size: 20,
                                color: primary,
                              ),
                              color: primaryLightColor,
                              width: 38,
                              alignment: Alignment.center,
                              boxShape: BoxShape.circle,
                            ),
                            Expanded(
                              Text(
                                'My favourite',
                                style: bodyMedium,
                                maxLines: 1,
                                textAlign: TextAlign.start,
                                overflow: TextOverflow.ellipsis,
                                lineHeight: 1.29,
                                fontSize: 17,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                            Icon(
                              IconData('arrowrightyp', custom: true),
                              size: 20,
                              color: iconColor,
                            ),
                          ],
                          spacing: 12,
                          onTap: () {
                            context.push(FavouritePage());
                          },
                        ),
                        Container(
                          color: borderColor,
                          width: double.infinity,
                          height: 1,
                        ),
                        Row(
                          children: [
                            Container(
                              child: Icon(
                                IconData('notificationyp', custom: true),
                                size: 20,
                                color: primary,
                              ),
                              color: primaryLightColor,
                              width: 38,
                              alignment: Alignment.center,
                              boxShape: BoxShape.circle,
                            ),
                            Expanded(
                              Text(
                                'Notifications',
                                style: bodyMedium,
                                maxLines: 1,
                                textAlign: TextAlign.start,
                                overflow: TextOverflow.ellipsis,
                                lineHeight: 1.52,
                                fontSize: 17,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                            Icon(
                              IconData('arrowrightyp', custom: true),
                              size: 20,
                              color: iconColor,
                            ),
                          ],
                          spacing: 12,
                          visible: Constant('featureNotifications'),
                          onTap: () {
                            appState.homePageIndex = 2;
                          },
                        ),
                        Container(
                          color: borderColor,
                          width: double.infinity,
                          height: 1,
                          visible: Constant('featureNotifications'),
                        ),
                        Row(
                          children: [
                            Container(
                              child: Icon(
                                'collections_bookmark_outlined',
                                size: 20,
                                color: primary,
                              ),
                              color: primaryLightColor,
                              width: 38,
                              alignment: Alignment.center,
                              boxShape: BoxShape.circle,
                            ),
                            Expanded(
                              Text(
                                'My scans',
                                style: bodyMedium,
                                maxLines: 1,
                                textAlign: TextAlign.start,
                                overflow: TextOverflow.ellipsis,
                                lineHeight: 1.52,
                                fontSize: 17,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                            Icon(
                              IconData('arrowrightyp', custom: true),
                              size: 20,
                              color: iconColor,
                            ),
                          ],
                          spacing: 12,
                          onTap: () {
                            appState.homePageIndex = 2;
                          },
                        ),
                      ],
                      crossAxis: CrossAxis.start,
                      spacing: 16,
                    ),
                    color: buttonBg,
                    borderRadius: Constant('radius2Xl'),
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
                animations: [
                  WidgetAnimation(
                    effects: [
                      SlideEffect(
                        beginDx: -100.0,
                        beginDy: 0,
                        endDx: 0,
                        endDy: 0,
                        delayMs: 100,
                        durationMs: 100.0,
                      ),
                      FadeEffect(
                        begin: 0,
                        end: 1,
                        delayMs: 100,
                        durationMs: 100.0,
                      ),
                    ],
                    applyInitialState: true,
                  ),
                ],
                name: 'SavedColumn',
              ),
              Column(
                children: [
                  Text(
                    'Support & settings',
                    style: bodyMedium,
                    textAlign: TextAlign.start,
                    lineHeight: 1.28,
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
                            Container(
                              child: Icon(
                                IconData('helpsupportyp', custom: true),
                                size: 20,
                                color: primary,
                              ),
                              color: primaryLightColor,
                              width: 38,
                              alignment: Alignment.center,
                              boxShape: BoxShape.circle,
                            ),
                            Expanded(
                              Text(
                                'Help & support',
                                style: bodyMedium,
                                maxLines: 1,
                                textAlign: TextAlign.start,
                                overflow: TextOverflow.ellipsis,
                                lineHeight: 1.29,
                                fontSize: 17,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                            Icon(
                              IconData('arrowrightyp', custom: true),
                              size: 20,
                              color: iconColor,
                            ),
                          ],
                          spacing: 12,
                          visible: Constant('featureSupportContact'),
                          onTap: () {
                            context.push(HelpSupportPage());
                          },
                        ),
                        Container(
                          color: borderColor,
                          width: double.infinity,
                          height: 1,
                          visible: Constant('featureSupportContact'),
                        ),
                        Row(
                          children: [
                            Container(
                              child: Icon(
                                IconData('settingsyp', custom: true),
                                size: 20,
                                color: primary,
                              ),
                              color: primaryLightColor,
                              width: 38,
                              alignment: Alignment.center,
                              boxShape: BoxShape.circle,
                            ),
                            Expanded(
                              Text(
                                'Settings',
                                style: bodyMedium,
                                maxLines: 1,
                                textAlign: TextAlign.start,
                                overflow: TextOverflow.ellipsis,
                                lineHeight: 1.29,
                                fontSize: 17,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                            Icon(
                              IconData('arrowrightyp', custom: true),
                              size: 20,
                              color: iconColor,
                            ),
                          ],
                          spacing: 12,
                          onTap: () {
                            context.push(SettingsPage());
                          },
                        ),
                        Container(
                          color: borderColor,
                          width: double.infinity,
                          height: 1,
                        ),
                        Row(
                          children: [
                            Container(
                              child: Icon(
                                IconData('appearanceyp', custom: true),
                                size: 20,
                                color: primary,
                              ),
                              color: primaryLightColor,
                              width: 38,
                              alignment: Alignment.center,
                              boxShape: BoxShape.circle,
                            ),
                            Expanded(
                              Text(
                                'Appearance',
                                style: bodyMedium,
                                maxLines: 1,
                                textAlign: TextAlign.start,
                                overflow: TextOverflow.ellipsis,
                                lineHeight: 1.29,
                                fontSize: 17,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                            Icon(
                              IconData('arrowrightyp', custom: true),
                              size: 20,
                              color: iconColor,
                            ),
                          ],
                          spacing: 12,
                          onTap: () {
                            ShowBottomSheet(
                              AppearanceComponent(),
                              backgroundColor: Color(0x00000000),
                              enableDrag: false,
                            );
                          },
                        ),
                      ],
                      crossAxis: CrossAxis.start,
                      spacing: 16,
                    ),
                    color: buttonBg,
                    borderRadius: Constant('radius2Xl'),
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
                animations: [
                  WidgetAnimation(
                    effects: [
                      SlideEffect(
                        beginDx: -100.0,
                        beginDy: 0,
                        endDx: 0,
                        endDy: 0,
                        delayMs: 150.0,
                        durationMs: 100.0,
                      ),
                      FadeEffect(
                        begin: 0,
                        end: 1,
                        delayMs: 150.0,
                        durationMs: 100.0,
                      ),
                    ],
                    applyInitialState: true,
                  ),
                ],
                name: 'SupportColumn',
              ),
            ],
            spacing: 16,
            primary: true,
            startSpacing: 16,
            endSpacing: 12,
          ),
        ),
        Button(
          'Log out',
          icon: IconSpec(
            IconData('logoutyp', custom: true),
            size: 24,
            color: error,
          ),
          width: double.infinity,
          height: 56,
          color: lightRed,
          textColor: error,
          borderRadius: 60,
          style: titleSmall,
          fontSize: 18,
          fontWeight: FontWeight.w600,
          lineHeight: 1,
          borderColor: lightRed,
          borderWidth: 1,
          elevation: 0,
          innerPadding: EdgeInsets.only(left: 20, right: 20),
          padding: EdgeInsets.only(
            left: Constant('mainPadding'),
            top: 12,
            right: Constant('mainPadding'),
            bottom: 16,
          ),
          onTap: () {
            ShowBottomSheet(
              LogOutComponent(
                isLogOutTap: () {
                  DataClearBlock();
                  DismissBottomSheet();
                  context.push(WelcomeScreenPage(), allowBack: false);
                },
              ),
              backgroundColor: Color(0x00000000),
              enableDrag: false,
            );
          },
        ),
      ],
      crossAxis: CrossAxis.start,
    ),
    color: Color(0x00000000),
  );
}
