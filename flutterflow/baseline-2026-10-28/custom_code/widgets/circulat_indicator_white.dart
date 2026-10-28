class CirculatIndicatorWhite extends StatefulWidget {
  const CirculatIndicatorWhite({
    super.key,
    this.width,
    this.height,
  });

  final double? width;
  final double? height;

  @override
  State<CirculatIndicatorWhite> createState() => _CirculatIndicatorWhiteState();
}

class _CirculatIndicatorWhiteState extends State<CirculatIndicatorWhite> {
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.width,
      height: widget.height,
      child: CircularProgressIndicator(
        strokeWidth: 2.0, // Set the stroke width here
        valueColor: AlwaysStoppedAnimation<Color>(
          Colors.white,
        ),
      ),
    );
  }
}