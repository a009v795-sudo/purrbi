@Component()
class ScanComponent {
  final MainDataModel detail;
  final UnsupportedAction onTap;
  build() => Container(
    child: Container(
      padding: EdgeInsets.all(12),
      child: Row(
        children: [
          Image(
            detail.image ??
                'https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/bop5sl517b6w/sub_cat_34.png',
            width: 86,
            height: 86,
            borderRadius: 16,
            showErrorImage: true,
            padding: EdgeInsets.only(right: 8),
          ),
          Expanded(
            Column(
              children: [
                Text(
                  detail.name ?? 'Name',
                  style: bodyMedium,
                  textAlign: TextAlign.start,
                  lineHeight: 1.46,
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
                Text(
                  detail.subName ?? 'SnackHub',
                  style: bodyMedium,
                  color: secondaryText,
                  textAlign: TextAlign.start,
                  lineHeight: 1.46,
                  fontSize: 14,
                  fontWeight: FontWeight.w400,
                ),
                Text(
                  detail.Barcode ?? 'Barcode: 8901000001001',
                  style: bodyMedium,
                  color: secondaryText,
                  textAlign: TextAlign.start,
                  lineHeight: 1.46,
                  fontSize: 13,
                  fontWeight: FontWeight.w400,
                ),
                Row(
                  children: [
                    Icon(
                      'calendar_month_outlined',
                      size: 14,
                      color: secondaryText,
                    ),
                    Text(
                      detail.date ?? '08 Aug 2026',
                      style: bodyMedium,
                      color: secondaryText,
                      textAlign: TextAlign.start,
                      lineHeight: 1.46,
                      fontSize: 11,
                      fontWeight: FontWeight.w400,
                    ),
                    Icon(
                      'history_sharp',
                      size: 14,
                      color: secondaryText,
                      padding: EdgeInsets.only(left: 4),
                    ),
                    Text(
                      detail.time ?? '10:00 AM',
                      style: bodyMedium,
                      color: secondaryText,
                      textAlign: TextAlign.start,
                      lineHeight: 1.46,
                      fontSize: 11,
                      fontWeight: FontWeight.w400,
                      padding: EdgeInsets.only(right: 4),
                    ),
                    Container(
                      padding: EdgeInsets.only(
                        left: 8,
                        top: 4,
                        right: 8,
                        bottom: 4,
                      ),
                      child: Row(
                        children: [
                          Container(
                            color: success,
                            width: 6,
                            boxShape: BoxShape.circle,
                          ),
                          Text(
                            'Verified',
                            style: bodyMedium,
                            color: success,
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                          ),
                        ],
                        spacing: 6,
                      ),
                      color: suceess50,
                      borderRadius: 50,
                    ),
                  ],
                  spacing: 4,
                ),
              ],
              crossAxis: CrossAxis.start,
              spacing: 2,
            ),
          ),
          Container(
            child: ConditionalBuilder(
              children: [
                PlaceholderWidget(
                  children: [
                    Icon(
                      IconData('favoritefyp', custom: true),
                      size: 18,
                      color: primary,
                    ),
                  ],
                  visible:
                      appState.favouriteDataList
                          .where((e) => e == detail)
                          .isSet,
                ),
                PlaceholderWidget(
                  children: [
                    Icon(
                      IconData('favoriteuyp', custom: true),
                      size: 18,
                      color: primary,
                    ),
                  ],
                ),
              ],
            ),
            color: Color(0x7CFFFFFF),
            width: 30,
            alignment: Alignment.center,
            margin: EdgeInsets.only(top: 12, right: 12),
            boxShape: BoxShape.circle,
            outerAlignment: Alignment.topRight,
            onTap: () {
              if (appState.connected) {
                AddOrRemoveIdentificationFavourite(
                  data: detail,
                  shouldSetState: true,
                );
              } else {
                internetSnackbar(shouldSetState: true);
              }
            },
          ),
        ],
        onTap: () {
          ParamAction('onTap');
        },
      ),
      color: buttonBg,
      borderRadius: 16,
      borderColor: borderColor,
      height: 118,
    ),
    color: Color(0x00000000),
  );
}
