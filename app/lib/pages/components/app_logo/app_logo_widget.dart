import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/pages/components/mini_logo/mini_logo_widget.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'app_logo_model.dart';
export 'app_logo_model.dart';

class AppLogoWidget extends StatefulWidget {
  const AppLogoWidget({
    super.key,
    required this.height,
    required this.width,
  });

  final double? height;
  final double? width;

  @override
  State<AppLogoWidget> createState() => _AppLogoWidgetState();
}

class _AppLogoWidgetState extends State<AppLogoWidget> {
  late AppLogoModel _model;

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => AppLogoModel());

    WidgetsBinding.instance.addPostFrameCallback((_) => safeSetState(() {}));
  }

  @override
  void dispose() {
    _model.maybeDispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 120.0,
      height: 120.0,
      decoration: BoxDecoration(
        color: FlutterFlowTheme.of(context).primaryBackground,
        shape: BoxShape.circle,
        border: Border.all(
          color: FlutterFlowTheme.of(context).borderColor,
          width: 1.0,
        ),
      ),
      alignment: AlignmentDirectional(0.0, 0.0),
      child: wrapWithModel(
        model: _model.miniLogoModel,
        updateCallback: () => safeSetState(() {}),
        child: MiniLogoWidget(
          hight: 72.0,
          width: 72.0,
        ),
      ),
    );
  }
}
