@Component()
class ExploreComponent {
  build() => Container(
    child: Column(
      children: [
        CenterAppbar(title: 'Explore ', padding: EdgeInsets.only(top: 47)),
        Container(
          child: Row(
            children: [
              Icon(IconData('searchyp', custom: true), color: iconColor),
              Expanded(
                Text(
                  'Search barcode....',
                  style: bodyMedium,
                  color: secondaryText,
                  maxLines: 1,
                  textAlign: TextAlign.start,
                  overflow: TextOverflow.ellipsis,
                  lineHeight: 1.52,
                  fontSize: 17,
                  fontWeight: FontWeight.w400,
                ),
              ),
            ],
            spacing: 16,
            applyStartEndSpace: true,
          ),
          color: buttonBg,
          borderRadius: 32,
          borderColor: borderColor,
          borderWidth: 1,
          width: double.infinity,
          height: 54,
          margin: EdgeInsets.only(
            left: Constant('mainPadding'),
            top: 16,
            right: Constant('mainPadding'),
            bottom: 4,
          ),
          onTap: () {
            context.push(SearchPage());
          },
        ),
        Expanded(
          ListView(
            children: [
              Image(
                'projects/a-i-barcode-identifier-app-ahbvz7/assets/mz3q50wtcyk3/explore-banner_.png',
                isNetwork: false,
                fit: ImageFit.fill,
                width: double.infinity,
                height: 198,
                borderRadius: 24,
                padding: EdgeInsets.only(
                  left: Constant('mainPadding'),
                  right: Constant('mainPadding'),
                  bottom: 16,
                ),
              ),
              Column(
                children: [
                  RowComponent(
                    text: 'Popular',
                    isShow: true,
                    viewAllAction: () {
                      context.push(PopularfootprintPage());
                    },
                  ),
                  Wrap(
                    children: [
                      ScanComponent(
                        detail: ItemRef(),
                        uniqueKey: ItemRef().index,
                        padding: EdgeInsets.all(8),
                        animations: [
                          WidgetAnimation(
                            effects: [
                              SlideEffect(
                                beginDx: 0,
                                beginDy: 60.0,
                                endDx: 0,
                                endDy: 0,
                                delayMs: (ItemRef().index) * 20,
                                durationMs: 200.0,
                              ),
                              FadeEffect(
                                begin: 0,
                                end: 1,
                                delayMs: (ItemRef().index) * 20,
                                durationMs: 200.0,
                              ),
                            ],
                            applyInitialState: true,
                          ),
                        ],
                        onTap: () {
                          context.push(
                            ResultDetailsPage(
                              images: ItemRef().image,
                              title: ItemRef().name,
                            ),
                          );
                        },
                      ),
                    ],
                    padding: EdgeInsets.only(left: 8, top: 8, right: 8),
                    outerAlignment: Alignment.centerLeft,
                  ),
                ],
              ),
              Container(
                child: Column(
                  children: [
                    Column(
                      children: [
                        RowComponent(
                          text: 'Category',
                          isShow: true,
                          padding: EdgeInsets.only(bottom: 16),
                          viewAllAction: () {
                            context.push(CategoprieListPage());
                          },
                        ),
                      ],
                    ),
                    Wrap(
                      children: [
                        Stack(
                          children: [
                            Container(
                              child: Row(
                                children: [
                                  Expanded(
                                    Column(
                                      children: [
                                        Text(
                                          ItemRef().name ?? 'Food & Beverages',
                                          style: bodyMedium,
                                          color: primaryText,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          fontSize: 18,
                                          fontWeight: FontWeight.w600,
                                          padding: EdgeInsets.only(
                                            left: 12,
                                            right: 12,
                                          ),
                                        ),
                                        Row(
                                          children: [
                                            Text(
                                              'Explore',
                                              style: bodyMedium,
                                              color: primaryText,
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              fontSize: 11,
                                              fontWeight: FontWeight.w400,
                                              padding: EdgeInsets.only(
                                                left: 12,
                                                right: 12,
                                              ),
                                            ),
                                            Icon(
                                              'keyboard_arrow_right',
                                              size: 14,
                                              color: primaryText,
                                            ),
                                          ],
                                        ),
                                      ],
                                      crossAxis: CrossAxis.start,
                                      spacing: 6,
                                      padding: EdgeInsets.only(
                                        left: 16,
                                        top: 16,
                                        bottom: 16,
                                      ),
                                    ),
                                  ),
                                  Image(
                                    ItemRef().img ??
                                        'https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/39v7pux7h1up/recent-4.png',
                                    width: 78,
                                    height: 78,
                                    borderRadius: 8,
                                    cached: false,
                                  ),
                                ],
                              ),
                              borderRadius: 16,
                              borderColor: borderColor,
                              width:
                                  (globalProperties.screenWidth >
                                          (Constant('maxWidth')))
                                      ? (((Constant('maxWidth')) - 48) * 1 / 2)
                                      : ((globalProperties.screenWidth - 48) *
                                          1 /
                                          2),
                              height: 98,
                              alignment: Alignment.center,
                            ),
                          ],
                          alignment: Alignment.topLeft,
                          onTap: () {
                            appState.selectExplore = ItemRef().name;
                            context.push(
                              CategopriePage(appbarName: ItemRef().name),
                            );
                          },
                        ),
                      ],
                      spacing: 16,
                      runSpacing: 16,
                      padding: EdgeInsets.only(left: 16, right: 16),
                    ),
                  ],
                ),
              ),
              Column(
                children: [
                  RowComponent(
                    text: 'Trending now',
                    isShow: true,
                    padding: EdgeInsets.only(top: 16, bottom: 16),
                    viewAllAction: () {
                      context.push(TrendingnowPage());
                    },
                  ),
                  ListView(
                    source: appState.MainDataList.where(
                      (e) => e.Trendingnow == true,
                    ),
                    maxItems: 2,
                    itemBuilder:
                        (trendingList) => ScanComponent(
                          detail: trendingList,
                          uniqueKey: trendingList.index,
                          padding: EdgeInsets.all(8),
                          animations: [
                            WidgetAnimation(
                              effects: [
                                SlideEffect(
                                  beginDx: 0,
                                  beginDy: 60.0,
                                  endDx: 0,
                                  endDy: 0,
                                  delayMs: trendingList.index * 20,
                                  durationMs: 200.0,
                                ),
                                FadeEffect(
                                  begin: 0,
                                  end: 1,
                                  delayMs: trendingList.index * 20,
                                  durationMs: 200.0,
                                ),
                              ],
                              applyInitialState: true,
                            ),
                          ],
                          onTap: () {
                            context.push(
                              ResultDetailsPage(
                                images: trendingList.image,
                                title: trendingList.name,
                              ),
                            );
                          },
                        ),
                    shrinkWrap: true,
                    primary: true,
                    padding: EdgeInsets.only(left: 8, top: 8, right: 8),
                    outerAlignment: Alignment.centerLeft,
                  ),
                ],
              ),
            ],
            shrinkWrap: true,
            startSpacing: 8,
            endSpacing: 8,
          ),
        ),
      ],
      crossAxis: CrossAxis.start,
    ),
    color: Color(0x00000000),
    animations: [
      WidgetAnimation(
        effects: [
          FadeEffect(begin: 0.0, end: 1.0, delayMs: 0.0, durationMs: 300.0),
          ScaleEffect(
            beginDx: 0.9,
            endDx: 1.0,
            beginDy: 0.9,
            endDy: 1.0,
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
