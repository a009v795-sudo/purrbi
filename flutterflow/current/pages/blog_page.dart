@Page(route: '/')
class BlogPage {
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
                title: 'Blog',
                isBack: false,
                isEdit: false,
                isShare: false,
              ),
              Expanded(
                ListView(
                  source: appState.BolgDataList,
                  itemBuilder:
                      (getInspired) => BlogComponent(
                        detail: getInspired,
                        width: constants.infinity,
                        uniqueKey: getInspired.name,
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          right: Constant('mainPadding'),
                        ),
                        onTapAction: () {
                          context.push(
                            BlolgDetailPage(blogDetail: getInspired),
                          );
                        },
                      ),
                  spacing: 16,
                  primary: true,
                  applyStartEndSpace: true,
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
