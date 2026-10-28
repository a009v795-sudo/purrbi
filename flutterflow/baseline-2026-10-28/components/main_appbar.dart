@Component()
class MainAppbar {
  final String title;
  final bool isBack = false;
  final UnsupportedAction backAction;
  final bool isEdit = false;
  final UnsupportedAction editAction;
  final bool isShare = false;
  final UnsupportedAction shareAction;
  build() => Container(
    padding: EdgeInsets.only(
      left: Constant('mainPadding'),
      top: 11,
      right: Constant('mainPadding'),
      bottom: 12,
    ),
    child: Row(
      children: [
        ConditionalBuilder(
          children: [
            PlaceholderWidget(
              children: [
                Container(
                  child: Icon(
                    IconData('arrowbackyp', custom: true),
                    color: primaryText,
                  ),
                  color: buttonBg,
                  borderColor: borderColor,
                  borderWidth: 1,
                  width: 40,
                  alignment: Alignment.center,
                  boxShape: BoxShape.circle,
                  onTap: () {
                    context.safePop();
                  },
                ),
              ],
              visible: isBack == false,
            ),
            PlaceholderWidget(
              children: [
                Container(
                  child: Icon(
                    IconData('arrowbackyp', custom: true),
                    color: primaryText,
                  ),
                  color: buttonBg,
                  borderColor: borderColor,
                  borderWidth: 1,
                  width: 40,
                  alignment: Alignment.center,
                  boxShape: BoxShape.circle,
                  onTap: () {
                    ParamAction('backAction');
                  },
                ),
              ],
            ),
          ],
        ),
        Expanded(
          Text(
            title ?? ' ',
            style: bodyMedium,
            maxLines: 1,
            textAlign: TextAlign.center,
            overflow: TextOverflow.ellipsis,
            lineHeight: 1.2,
            fontSize: 20,
            fontWeight: FontWeight.w600,
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
          ),
        ),
        ConditionalBuilder(
          children: [
            PlaceholderWidget(
              children: [
                Container(
                  child: Icon(
                    IconData('editprofileyp', custom: true),
                    color: primaryText,
                  ),
                  color: buttonBg,
                  borderColor: borderColor,
                  borderWidth: 1,
                  width: 40,
                  alignment: Alignment.center,
                  boxShape: BoxShape.circle,
                  onTap: () {
                    ParamAction('editAction');
                  },
                ),
              ],
              visible: isEdit == true,
            ),
            PlaceholderWidget(
              children: [
                Container(
                  child: Icon('share_outlined', color: primaryText),
                  color: buttonBg,
                  borderColor: borderColor,
                  borderWidth: 1,
                  width: 40,
                  alignment: Alignment.center,
                  boxShape: BoxShape.circle,
                  onTap: () {
                    ParamAction('shareAction');
                  },
                ),
              ],
              visible: isShare == true,
            ),
            PlaceholderWidget(
              children: [Container(width: 40, boxShape: BoxShape.circle)],
            ),
          ],
        ),
      ],
      mainAxis: MainAxis.spaceBetween,
      spacing: 8,
      minSize: MainAxisSize.min,
    ),
    color: Color(0x00000000),
    animations: [
      WidgetAnimation(
        effects: [
          FadeEffect(begin: 0.0, end: 1.0, delayMs: 0.0, durationMs: 300.0),
          SlideEffect(
            beginDx: 0.0,
            beginDy: -20.0,
            endDx: 0.0,
            endDy: 0.0,
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
