@Component()
class BotMessageSheetComponet {
  final UnsupportedAction copyAction;
  final UnsupportedAction shareAction;
  final UnsupportedAction selectTextAction;
  build() => Container(
    child: Container(
      child: Column(
        children: [
          Row(
            children: [
              Container(
                color: borderColor,
                borderRadius: 20,
                width: 48,
                height: 6,
              ),
            ],
            mainAxis: MainAxis.center,
          ),
          Container(
            child: Column(
              children: [
                Container(
                  padding: EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Icon('content_copy_rounded', color: primary),
                      Expanded(
                        Text(
                          'Copy',
                          style: bodyMedium,
                          maxLines: 1,
                          textAlign: TextAlign.start,
                          overflow: TextOverflow.ellipsis,
                          lineHeight: 1.33,
                          fontSize: 18,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                    spacing: 12,
                  ),
                  color: buttonBg,
                  borderRadius: 16,
                  borderColor: borderColor,
                  borderWidth: 1,
                  width: double.infinity,
                  margin: EdgeInsets.only(
                    left: Constant('mainPadding'),
                    right: Constant('mainPadding'),
                  ),
                  onTap: () {
                    ParamAction('copyAction');
                  },
                ),
                Container(
                  padding: EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Icon('share_rounded', color: primary),
                      Expanded(
                        Text(
                          'Share',
                          style: bodyMedium,
                          maxLines: 1,
                          textAlign: TextAlign.start,
                          overflow: TextOverflow.ellipsis,
                          lineHeight: 1.33,
                          fontSize: 18,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                    spacing: 12,
                  ),
                  color: buttonBg,
                  borderRadius: 16,
                  borderColor: borderColor,
                  borderWidth: 1,
                  width: double.infinity,
                  margin: EdgeInsets.only(
                    left: Constant('mainPadding'),
                    right: Constant('mainPadding'),
                  ),
                  onTap: () {
                    ParamAction('shareAction');
                  },
                ),
                Container(
                  padding: EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Icon('receipt_outlined', color: primary),
                      Expanded(
                        Text(
                          'Select text',
                          style: bodyMedium,
                          maxLines: 1,
                          textAlign: TextAlign.start,
                          overflow: TextOverflow.ellipsis,
                          lineHeight: 1.33,
                          fontSize: 18,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                    spacing: 12,
                  ),
                  color: buttonBg,
                  borderRadius: 16,
                  borderColor: borderColor,
                  borderWidth: 1,
                  width: double.infinity,
                  margin: EdgeInsets.only(
                    left: Constant('mainPadding'),
                    right: Constant('mainPadding'),
                  ),
                  onTap: () {
                    ParamAction('selectTextAction');
                  },
                ),
              ],
              crossAxis: CrossAxis.start,
              spacing: 16,
              applyStartEndSpace: true,
            ),
            borderRadius: 8,
            width: double.infinity,
          ),
        ],
        minSize: MainAxisSize.min,
        startSpacing: 16,
        endSpacing: 16,
      ),
      color: secondaryBackground,
      borderRadius: BorderRadius.only(topLeft: 26, topRight: 26),
    ),
    color: Color(0x00000000),
    animations: [
      WidgetAnimation(
        effects: [
          FadeEffect(begin: 0.0, end: 1.0, delayMs: 0.0, durationMs: 300.0),
          SlideEffect(
            beginDx: 0.0,
            beginDy: 24.0,
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
