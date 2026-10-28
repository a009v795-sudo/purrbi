@Component()
class HistoryComponent {
  int tabIndex = 0;
  build() => Container(
    child: Column(
      children: [
        CenterAppbar(title: 'History', padding: EdgeInsets.only(top: 47)),
        Container(
          padding: EdgeInsets.all(8),
          child: Row(
            children: [
              Expanded(
                Container(
                  child: Text(
                    'Saved result',
                    style: bodyMedium,
                    color: (tabIndex == 0) ? Color(0xFFFFFFFF) : primaryText,
                    lineHeight: 1.47,
                    fontSize: 15,
                  ),
                  color: (tabIndex == 0) ? primary : secondaryBackground,
                  borderRadius: 99,
                  width: double.infinity,
                  height: double.infinity,
                  alignment: Alignment.center,
                  onTap: () {
                    tabIndex = 0;
                  },
                ),
              ),
              Expanded(
                Container(
                  child: Text(
                    'History',
                    style: bodyMedium,
                    color: (tabIndex == 1) ? Color(0xFFFFFFFF) : primaryText,
                    fontSize: 15,
                    fontWeight: FontWeight.w400,
                  ),
                  color: (tabIndex == 1) ? primary : secondaryBackground,
                  borderRadius: 99,
                  width: double.infinity,
                  height: double.infinity,
                  alignment: Alignment.center,
                  onTap: () {
                    tabIndex = 1;
                  },
                ),
              ),
            ],
          ),
          color: secondaryBackground,
          borderRadius: 99,
          borderColor: borderColor,
          width: double.infinity,
          height: 58,
          margin: EdgeInsets.only(left: 16, right: 16),
        ),
        Expanded(
          ListView(
            source: appState.RecentidentifierList,
            itemBuilder:
                (item) => RecentIdentifier(
                  detail: item,
                  uniqueKey: item.index,
                  name: 'HistoryRecentCard',
                  onTapAction: () {
                    context.push(
                      HistorySaveDetailsPage(
                        images: item.img,
                        title: item.title,
                      ),
                    );
                  },
                ),
            spacing: 12,
            primary: true,
            startSpacing: 12,
            padding: EdgeInsets.only(left: 16, right: 16),
            name: 'HistoryRecentList',
          ),
        ),
      ],
      crossAxis: CrossAxis.start,
    ),
    color: Color(0x00000000),
  );
}
