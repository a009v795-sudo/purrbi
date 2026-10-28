@Page(route: '/')
class SearchPage {
  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Column(
            children: [
              MainAppbar(
                title: 'Search',
                isBack: false,
                isEdit: false,
                isShare: false,
              ),
              TextField(
                hint: 'Search barcode....',
                prefixIcon: IconData('searchyp', custom: true),
                prefixIconColor: iconColor,
                prefixIconSize: 24,
                suffixIconColor: primaryText,
                suffixIconSize: 24,
                maxLines: 1,
                style: bodyMedium,
                fontSize: 17,
                lineHeight: 1,
                hintStyle: labelMedium,
                hintColor: secondaryText,
                hintFontSize: 17,
                hintFontWeight: FontWeight.w400,
                hintLineHeight: 1,
                errorStyle: bodyMedium,
                errorColor: error,
                errorFontSize: 15,
                errorLineHeight: 1,
                borderColor: borderColor,
                borderRadius: 32,
                focusBorderColor: primary,
                errorBorderColor: error,
                fillColor: buttonBg,
                contentPadding: EdgeInsets.only(
                  left: 16,
                  top: 15,
                  right: 16,
                  bottom: 15,
                ),
                cursorColor: primaryText,
                showClearButton: true,
                submitType: SubmitType.search,
                width: double.infinity,
                debounceTime: 100,
                setStateOnFocusChanged: true,
                padding: EdgeInsets.only(
                  left: Constant('mainPadding'),
                  top: 16,
                  right: Constant('mainPadding'),
                  bottom: 4,
                ),
                onSubmitted: (value) {
                  if (value != '') {
                    appState.searchList.add(value);
                  }
                },
              ),
              Expanded(
                ConditionalBuilder(
                  children: [
                    PlaceholderWidget(
                      children: [
                        ConditionalBuilder(
                          children: [
                            PlaceholderWidget(
                              children: [
                                ConditionalBuilder(
                                  children: [
                                    PlaceholderWidget(
                                      children: [
                                        Column(
                                          children: [
                                            Row(
                                              children: [
                                                Expanded(
                                                  Text(
                                                    'Recently Searches',
                                                    style: bodyMedium,
                                                    maxLines: 1,
                                                    textAlign: TextAlign.start,
                                                    overflow:
                                                        TextOverflow.ellipsis,
                                                    lineHeight: 1.33,
                                                    fontSize: 18,
                                                    fontWeight: FontWeight.w500,
                                                  ),
                                                ),
                                                Text(
                                                  'Clear all',
                                                  style: bodyMedium,
                                                  color: primary,
                                                  maxLines: 1,
                                                  textAlign: TextAlign.end,
                                                  lineHeight: 1.38,
                                                  fontSize: 13,
                                                  fontWeight: FontWeight.w500,
                                                  onTap: () {
                                                    appState.searchList.clear();
                                                  },
                                                ),
                                              ],
                                              mainAxis: MainAxis.spaceBetween,
                                              spacing: 8,
                                              padding: EdgeInsets.only(
                                                left: Constant('mainPadding'),
                                                right: Constant('mainPadding'),
                                              ),
                                            ),
                                            Expanded(
                                              Column(
                                                children: [
                                                  Row(
                                                    children: [
                                                      Expanded(
                                                        Text(
                                                          ItemRef(),
                                                          style: bodyMedium,
                                                          color: secondaryText,
                                                          textAlign:
                                                              TextAlign.start,
                                                          lineHeight: 1.52,
                                                          fontSize: 17,
                                                          fontWeight:
                                                              FontWeight.w400,
                                                          onTap: () {
                                                            SetFormField(
                                                              'TextField_s91i1ebw',
                                                              ItemRef(),
                                                            );
                                                          },
                                                        ),
                                                      ),
                                                      Icon(
                                                        IconData(
                                                          'closeyp',
                                                          custom: true,
                                                        ),
                                                        size: 20,
                                                        color: primaryText,
                                                        onTap: () {
                                                          appState.searchList
                                                              .removeAt(
                                                                ItemRef().index,
                                                              );
                                                        },
                                                      ),
                                                    ],
                                                    mainAxis:
                                                        MainAxis.spaceBetween,
                                                    crossAxis: CrossAxis.start,
                                                    spacing: 8,
                                                    padding: EdgeInsets.only(
                                                      left: Constant(
                                                        'mainPadding',
                                                      ),
                                                      right: Constant(
                                                        'mainPadding',
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                                crossAxis: CrossAxis.start,
                                                spacing: 16,
                                                scrollable: true,
                                              ),
                                            ),
                                          ],
                                          crossAxis: CrossAxis.start,
                                          spacing: 16,
                                          startSpacing: 12,
                                          endSpacing: 12,
                                        ),
                                      ],
                                      visible: appState.searchList.isSet,
                                    ),
                                    PlaceholderWidget(
                                      children: [
                                        Column(
                                          children: [
                                            Text(
                                              Bound(
                                                '7825c78f',
                                                'functionCall stringInterpolation',
                                              ),
                                              style: bodyMedium,
                                              color: primary,
                                              textAlign: TextAlign.start,
                                              lineHeight: 1.33,
                                              fontSize: 15,
                                              fontWeight: FontWeight.w500,
                                              padding: EdgeInsets.only(
                                                left: Constant('mainPadding'),
                                                right: Constant('mainPadding'),
                                              ),
                                            ),
                                            Expanded(
                                              ListView(
                                                children: [
                                                  Wrap(
                                                    children: [
                                                      ScanComponent(
                                                        detail: ItemRef(),
                                                        uniqueKey:
                                                            ItemRef().index,
                                                        padding: EdgeInsets.all(
                                                          8,
                                                        ),
                                                        onTap: () {
                                                          context.push(
                                                            ResultDetailsPage(
                                                              images:
                                                                  ItemRef()
                                                                      .image,
                                                              title:
                                                                  ItemRef()
                                                                      .name,
                                                            ),
                                                          );
                                                        },
                                                      ),
                                                    ],
                                                    padding: EdgeInsets.only(
                                                      left: 8,
                                                      right: 8,
                                                    ),
                                                  ),
                                                ],
                                                primary: true,
                                              ),
                                            ),
                                          ],
                                          crossAxis: CrossAxis.start,
                                          spacing: 4,
                                          startSpacing: 12,
                                          endSpacing: 8,
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ],
                              visible:
                                  (WidgetState('TextField_s91i1ebw').text) ==
                                  '',
                            ),
                            PlaceholderWidget(
                              children: [
                                ConditionalBuilder(
                                  children: [
                                    PlaceholderWidget(
                                      children: [
                                        Column(
                                          children: [
                                            Text(
                                              '${Count(searchFunction(WidgetState('TextField_s91i1ebw').text, appState.MainDataList))} results for "${WidgetState('TextField_s91i1ebw').text}"',
                                              style: bodyMedium,
                                              color: primary,
                                              textAlign: TextAlign.start,
                                              lineHeight: 1.33,
                                              fontSize: 15,
                                              fontWeight: FontWeight.w500,
                                              padding: EdgeInsets.only(
                                                left: Constant('mainPadding'),
                                                right: Constant('mainPadding'),
                                              ),
                                            ),
                                            Expanded(
                                              ListView(
                                                children: [
                                                  Wrap(
                                                    children: [
                                                      ScanComponent(
                                                        detail: ItemRef(),
                                                        uniqueKey:
                                                            ItemRef().index,
                                                        padding: EdgeInsets.all(
                                                          8,
                                                        ),
                                                        onTap: () {
                                                          context.push(
                                                            ResultDetailsPage(
                                                              images:
                                                                  ItemRef()
                                                                      .image,
                                                              title:
                                                                  ItemRef()
                                                                      .name,
                                                            ),
                                                          );
                                                        },
                                                      ),
                                                    ],
                                                    padding: EdgeInsets.only(
                                                      left: 8,
                                                      right: 8,
                                                    ),
                                                  ),
                                                ],
                                                primary: true,
                                              ),
                                            ),
                                          ],
                                          crossAxis: CrossAxis.start,
                                          spacing: 4,
                                          startSpacing: 12,
                                          endSpacing: 8,
                                        ),
                                      ],
                                      visible:
                                          searchFunction(
                                            WidgetState(
                                              'TextField_s91i1ebw',
                                            ).text,
                                            appState.MainDataList,
                                          ).isSet,
                                    ),
                                    PlaceholderWidget(
                                      children: [NoDataFoundComponent()],
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                      visible: appState.connected,
                    ),
                    PlaceholderWidget(children: [NoInternetComponent()]),
                  ],
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
    disableResizeToAvoidBottomInset: true,
  );
}
