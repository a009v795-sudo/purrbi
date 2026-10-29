import '/backend/backend.dart';
import '/backend/schema/structs/index.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/actions/actions.dart' as action_blocks;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

Future internetSnackbar(BuildContext context) async {
  await action_blocks.mainSanckbar(
    context,
    title: 'Please turn on internet...',
  );
}

Future mainSanckbar(
  BuildContext context, {
  String? title,
}) async {
  ScaffoldMessenger.of(context).clearSnackBars();
  ScaffoldMessenger.of(context).clearSnackBars();
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(
        title!,
        style: GoogleFonts.inter(
          color: FlutterFlowTheme.of(context).whiteToBlackColor,
          fontSize: 17.0,
        ),
        textAlign: TextAlign.start,
      ),
      duration: Duration(milliseconds: 2000),
      backgroundColor: FlutterFlowTheme.of(context).primaryText,
    ),
  );
}

Future addOrRemoveIdentificationFavourite(
  BuildContext context, {
  required MainDataModelStruct? data,
}) async {
  if (FFAppState()
      .favouriteDataList
      .where((e) => e == data)
      .toList()
      .isNotEmpty) {
    FFAppState().removeFromFavouriteDataList(data!);
    FFAppState().update(() {});
    await action_blocks.mainSanckbar(
      context,
      title: 'Removed from favourite',
    );
  } else {
    FFAppState().addToFavouriteDataList(data!);
    FFAppState().update(() {});
    await action_blocks.mainSanckbar(
      context,
      title: 'Added to favourite',
    );
  }
}

Future dataClearBlock(BuildContext context) async {
  FFAppState().isLogin = false;
  FFAppState().searchList = [];
  FFAppState().favouriteDataList = [];
  FFAppState().isPro = false;
  FFAppState().isAdsTap = 0;
  FFAppState().update(() {});
}
