@Page(route: '/')
class HomeMainPage {
  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Column(
            children: [
              Expanded(
                ConditionalBuilder(
                  children: [
                    PlaceholderWidget(
                      children: [HomeComponent()],
                      visible: appState.homePageIndex == 0,
                    ),
                    PlaceholderWidget(
                      children: [ExploreComponent()],
                      visible: appState.homePageIndex == 1,
                    ),
                    PlaceholderWidget(
                      children: [HistoryComponent()],
                      visible: appState.homePageIndex == 2,
                    ),
                    PlaceholderWidget(children: [ProfileComponent()]),
                  ],
                ),
              ),
              Container(
                child: Row(
                  children: [
                    Expanded(
                      Column(
                        children: [
                          ConditionalBuilder(
                            children: [
                              PlaceholderWidget(
                                children: [Icon('home', color: primary)],
                                visible: appState.homePageIndex == 0,
                              ),
                              PlaceholderWidget(
                                children: [
                                  Icon('home_outlined', color: iconColor),
                                ],
                              ),
                            ],
                          ),
                          Text(
                            'Home',
                            style: bodyMedium,
                            color:
                                (appState.homePageIndex == 0)
                                    ? primary
                                    : secondaryText,
                            maxLines: 1,
                            textAlign: TextAlign.center,
                            overflow: TextOverflow.ellipsis,
                            lineHeight: 1.42,
                            fontSize: 14,
                            fontWeight: FontWeight.w400,
                            padding: EdgeInsets.only(top: 4, bottom: 14),
                          ),
                        ],
                        startSpacing: 16,
                        onTap: () {
                          appState.homePageIndex = 0;
                        },
                      ),
                    ),
                    Expanded(
                      Column(
                        children: [
                          ConditionalBuilder(
                            children: [
                              PlaceholderWidget(
                                children: [
                                  Icon('explore_rounded', color: primary),
                                ],
                                visible: appState.homePageIndex == 1,
                              ),
                              PlaceholderWidget(
                                children: [
                                  Icon(
                                    IconData('exploreuyp', custom: true),
                                    color: iconColor,
                                  ),
                                ],
                              ),
                            ],
                          ),
                          Text(
                            'Explore',
                            style: bodyMedium,
                            color:
                                (appState.homePageIndex == 1)
                                    ? primary
                                    : secondaryText,
                            maxLines: 1,
                            textAlign: TextAlign.center,
                            overflow: TextOverflow.ellipsis,
                            lineHeight: 1.42,
                            fontSize: 14,
                            fontWeight: FontWeight.w400,
                            padding: EdgeInsets.only(top: 4, bottom: 14),
                          ),
                        ],
                        startSpacing: 16,
                        onTap: () {
                          appState.homePageIndex = 1;
                        },
                      ),
                    ),
                    Expanded(
                      Column(
                        children: [
                          Container(
                            child: Icon(
                              'qr_code_scanner',
                              size: 28,
                              color: Color(0xFFFFFFFF),
                            ),
                            color: primary,
                            width: 59,
                            alignment: Alignment.center,
                            boxShape: BoxShape.circle,
                            boxShadow: Shadow(
                              blur: 18,
                              color: Color(0x660E8A80),
                              dy: 8,
                            ),
                          ),
                        ],
                        onTap: () {
                          context.push(IdentifierPage());
                        },
                      ),
                    ),
                    Expanded(
                      Column(
                        children: [
                          ConditionalBuilder(
                            children: [
                              PlaceholderWidget(
                                children: [
                                  Icon(
                                    'collections_bookmark_rounded',
                                    color: primary,
                                  ),
                                ],
                                visible: appState.homePageIndex == 2,
                              ),
                              PlaceholderWidget(
                                children: [
                                  Icon(
                                    'collections_bookmark_outlined',
                                    color: iconColor,
                                  ),
                                ],
                              ),
                            ],
                          ),
                          Text(
                            'My scans',
                            style: bodyMedium,
                            color:
                                (appState.homePageIndex == 2)
                                    ? primary
                                    : secondaryText,
                            maxLines: 1,
                            textAlign: TextAlign.center,
                            overflow: TextOverflow.ellipsis,
                            lineHeight: 1.42,
                            fontSize: 14,
                            fontWeight: FontWeight.w400,
                            padding: EdgeInsets.only(top: 4, bottom: 14),
                          ),
                        ],
                        startSpacing: 16,
                        onTap: () {
                          appState.homePageIndex = 2;
                        },
                      ),
                    ),
                    Expanded(
                      Column(
                        children: [
                          ConditionalBuilder(
                            children: [
                              PlaceholderWidget(
                                children: [
                                  Icon(
                                    IconData('profilefyp', custom: true),
                                    color: primary,
                                  ),
                                ],
                                visible: appState.homePageIndex == 3,
                              ),
                              PlaceholderWidget(
                                children: [
                                  Icon(
                                    IconData('profileuyp', custom: true),
                                    color: iconColor,
                                  ),
                                ],
                              ),
                            ],
                          ),
                          Text(
                            'Profile',
                            style: bodyMedium,
                            color:
                                (appState.homePageIndex == 3)
                                    ? primary
                                    : secondaryText,
                            maxLines: 1,
                            textAlign: TextAlign.center,
                            overflow: TextOverflow.ellipsis,
                            lineHeight: 1.42,
                            fontSize: 14,
                            fontWeight: FontWeight.w400,
                            padding: EdgeInsets.only(top: 4, bottom: 14),
                          ),
                        ],
                        startSpacing: 16,
                        onTap: () {
                          appState.homePageIndex = 3;
                        },
                      ),
                    ),
                  ],
                  mainAxis: MainAxis.spaceBetween,
                ),
                color: buttonBg,
                borderRadius: 24,
                borderColor: borderColor,
                width: double.infinity,
                margin: EdgeInsets.all(16),
              ),
            ],
            crossAxis: CrossAxis.start,
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
      width: double.infinity,
      height: double.infinity,
    ),
    backgroundColor: bgColor,
    safeArea: false,
    disableResizeToAvoidBottomInset: true,
  );
}
