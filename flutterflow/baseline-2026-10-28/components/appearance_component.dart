@Component()
class AppearanceComponent {
  build() => Container(
    child: Container(
      padding: EdgeInsets.only(
        left: Constant('radius2Xl'),
        top: 16,
        right: Constant('radius2Xl'),
        bottom: 16,
      ),
      child: Column(
        children: [
          Container(
            color: grey20,
            borderRadius: 100,
            width: 70,
            height: 5,
            outerAlignment: Alignment.topCenter,
            onTap: () {
              DismissBottomSheet();
            },
          ),
          Row(
            children: [
              Expanded(
                Text(
                  'Appearance',
                  style: bodyMedium,
                  maxLines: 1,
                  textAlign: TextAlign.start,
                  overflow: TextOverflow.ellipsis,
                  lineHeight: 1.28,
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Icon(
                IconData('closebigyp', custom: true),
                color: primaryText,
                onTap: () {
                  DismissBottomSheet();
                },
              ),
            ],
            mainAxis: MainAxis.spaceBetween,
            spacing: 8,
            padding: EdgeInsets.only(top: 22, bottom: 4),
          ),
          Expanded(
            ListView(
              children: [
                Container(
                  padding: EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Icon(
                        IconData('lightmodeyp', custom: true),
                        color: primary,
                      ),
                      Expanded(
                        Text(
                          'Light',
                          style: bodyMedium,
                          maxLines: 1,
                          textAlign: TextAlign.start,
                          overflow: TextOverflow.ellipsis,
                          lineHeight: 1.28,
                          fontSize: 18,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      ConditionalBuilder(
                        children: [
                          PlaceholderWidget(
                            children: [
                              Icon(
                                IconData('checkcircleyp', custom: true),
                                color: primary,
                              ),
                            ],
                            visible: appState.modeIndex == 0,
                          ),
                          PlaceholderWidget(
                            children: [
                              Container(
                                borderColor: iconColor,
                                borderWidth: 1,
                                width: 24,
                                boxShape: BoxShape.circle,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                    spacing: 12,
                  ),
                  color: buttonBg,
                  borderRadius: 16,
                  borderColor: borderColor,
                  borderWidth: 1,
                  width: double.infinity,
                  onTap: () {
                    appState.modeIndex = 0;
                    SetDarkMode(DarkModePreference.light);
                    DismissBottomSheet();
                  },
                ),
                Container(
                  padding: EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Icon(IconData('darkpyp', custom: true), color: primary),
                      Expanded(
                        Text(
                          'Dark',
                          style: bodyMedium,
                          maxLines: 1,
                          textAlign: TextAlign.start,
                          overflow: TextOverflow.ellipsis,
                          lineHeight: 1.28,
                          fontSize: 18,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      ConditionalBuilder(
                        children: [
                          PlaceholderWidget(
                            children: [
                              Icon(
                                IconData('checkcircleyp', custom: true),
                                color: primary,
                              ),
                            ],
                            visible: appState.modeIndex == 1,
                          ),
                          PlaceholderWidget(
                            children: [
                              Container(
                                borderColor: iconColor,
                                borderWidth: 1,
                                width: 24,
                                boxShape: BoxShape.circle,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                    spacing: 12,
                  ),
                  color: buttonBg,
                  borderRadius: 16,
                  borderColor: borderColor,
                  borderWidth: 1,
                  width: double.infinity,
                  onTap: () {
                    appState.modeIndex = 1;
                    SetDarkMode(DarkModePreference.dark);
                    DismissBottomSheet();
                  },
                ),
                Container(
                  padding: EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Icon(IconData('systempyp', custom: true), color: primary),
                      Expanded(
                        Text(
                          'System',
                          style: bodyMedium,
                          maxLines: 1,
                          textAlign: TextAlign.start,
                          overflow: TextOverflow.ellipsis,
                          lineHeight: 1.28,
                          fontSize: 18,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      ConditionalBuilder(
                        children: [
                          PlaceholderWidget(
                            children: [
                              Icon(
                                IconData('checkcircleyp', custom: true),
                                color: primary,
                              ),
                            ],
                            visible: appState.modeIndex == 2,
                          ),
                          PlaceholderWidget(
                            children: [
                              Container(
                                borderColor: iconColor,
                                borderWidth: 1,
                                width: 24,
                                boxShape: BoxShape.circle,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                    spacing: 12,
                  ),
                  color: buttonBg,
                  borderRadius: 16,
                  borderColor: borderColor,
                  borderWidth: 1,
                  width: double.infinity,
                  onTap: () {
                    appState.modeIndex = 2;
                    SetDarkMode(DarkModePreference.system);
                    DismissBottomSheet();
                  },
                ),
              ],
              spacing: 16,
              primary: true,
              startSpacing: 12,
              endSpacing: 4,
            ),
          ),
        ],
        crossAxis: CrossAxis.start,
        minSize: MainAxisSize.min,
      ),
      color: buttonBg,
      borderRadius: BorderRadius.only(topLeft: 32, topRight: 32),
      width: double.infinity,
      height: ScreenPercent(40),
    ),
    color: Color(0x00000000),
  );
}
