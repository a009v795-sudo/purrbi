@Page(route: '/')
class CategoprieListPage {
  List<String> categoryList = [
    'All',
    'Food & Beverages',
    'Health & Beauty',
    'Household Products',
    'Electronics',
    'Fashion & Apparel',
    'Baby Products',
    'Pet Products',
    'Sports & Fitness',
    'Toys & Games',
    'Office & Stationery',
    'Automotive',
    'Home & Lifestyle',
  ];
  String catname = 'All';
  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Column(
            children: [
              MainAppbar(
                title: 'Category',
                isBack: false,
                isEdit: false,
                isShare: false,
              ),
              Expanded(
                ListView(
                  children: [
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
                      padding: EdgeInsets.only(left: 16, top: 16, right: 16),
                    ),
                  ],
                  primary: true,
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
      width: double.infinity,
      height: double.infinity,
    ),
    backgroundColor: bgColor,
    safeArea: false,
  );
}
