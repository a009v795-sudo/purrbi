@Component()
class RowComponent {
  final String text;
  final bool isShow = false;
  final UnsupportedAction viewAllAction;
  build() => Container(
    padding: EdgeInsets.only(
      left: Constant('mainPadding'),
      right: Constant('mainPadding'),
    ),
    child: Row(
      children: [
        Expanded(
          Text(
            text ?? 'Text',
            style: bodyMedium,
            maxLines: 1,
            textAlign: TextAlign.start,
            overflow: TextOverflow.ellipsis,
            lineHeight: 1.28,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        Text(
          'View all',
          style: bodyMedium,
          color: primary,
          maxLines: 1,
          textAlign: TextAlign.end,
          overflow: TextOverflow.ellipsis,
          lineHeight: 1.33,
          fontSize: 15,
          fontWeight: FontWeight.w500,
          visible: isShow,
          onTap: () {
            ParamAction('viewAllAction');
          },
        ),
        Icon('keyboard_arrow_right', color: primary, visible: isShow),
      ],
      mainAxis: MainAxis.spaceBetween,
      spacing: 4,
    ),
    color: Color(0x00000000),
  );
}
