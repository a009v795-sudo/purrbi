import '/backend/schema/structs/index.dart';
import '/flutter_flow/ff_builtin_enums.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'ingredient_detail_sheet_model.dart';
export 'ingredient_detail_sheet_model.dart';

/// DSL component IngredientDetailSheet
class IngredientDetailSheetWidget extends StatefulWidget {
  const IngredientDetailSheetWidget({
    super.key,
    this.row,
    this.petName,
  });

  final IngredientRowStruct? row;
  final String? petName;

  @override
  State<IngredientDetailSheetWidget> createState() =>
      _IngredientDetailSheetWidgetState();
}

class _IngredientDetailSheetWidgetState
    extends State<IngredientDetailSheetWidget> {
  late IngredientDetailSheetModel _model;

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => IngredientDetailSheetModel());

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
      decoration: BoxDecoration(
        color: FlutterFlowTheme.of(context).secondaryBackground,
        borderRadius: BorderRadius.circular(24.0),
      ),
      child: Padding(
        padding: EdgeInsetsDirectional.fromSTEB(20.0, 16.0, 20.0, 24.0),
        child: ListView(
          padding: EdgeInsets.zero,
          primary: false,
          children: [
            Row(
              mainAxisSize: MainAxisSize.max,
              mainAxisAlignment: (FFMainAxisAlignment.start).flutterValue,
              crossAxisAlignment: (FFCrossAxisAlignment.center).flutterValue,
              textBaseline: TextBaseline.alphabetic,
              children: [
                if (widget!.row?.color == 'green')
                  Icon(
                    Icons.check_circle_rounded,
                    color: FlutterFlowTheme.of(context).success,
                    size: 24.0,
                  ),
                if (widget!.row?.color == 'yellow')
                  Icon(
                    Icons.warning_amber_rounded,
                    color: FlutterFlowTheme.of(context).warning,
                    size: 24.0,
                  ),
                if (widget!.row?.color == 'red')
                  Icon(
                    Icons.error_rounded,
                    color: FlutterFlowTheme.of(context).error,
                    size: 24.0,
                  ),
                if (widget!.row?.color == 'gray')
                  Icon(
                    Icons.help_outline_rounded,
                    color: FlutterFlowTheme.of(context).secondaryText,
                    size: 24.0,
                  ),
                Expanded(
                  child: Text(
                    widget!.row!.name,
                    maxLines: 3,
                    style: FlutterFlowTheme.of(context).titleMedium.override(
                          font: GoogleFonts.nunito(
                            fontWeight: FlutterFlowTheme.of(context)
                                .titleMedium
                                .fontWeight,
                            fontStyle: FlutterFlowTheme.of(context)
                                .titleMedium
                                .fontStyle,
                          ),
                          letterSpacing: 0.0,
                          fontWeight: FlutterFlowTheme.of(context)
                              .titleMedium
                              .fontWeight,
                          fontStyle: FlutterFlowTheme.of(context)
                              .titleMedium
                              .fontStyle,
                        ),
                  ),
                ),
                FlutterFlowIconButton(
                  buttonSize: 40.0,
                  icon: Icon(
                    Icons.close_rounded,
                    color: FlutterFlowTheme.of(context).secondaryText,
                    size: 24.0,
                  ),
                  onPressed: () async {
                    Navigator.pop(context);
                  },
                ),
              ].divide(SizedBox(width: 10.0)),
            ),
            Text(
              widget!.row!.reason,
              style: FlutterFlowTheme.of(context).bodyMedium.override(
                    font: GoogleFonts.nunito(
                      fontWeight:
                          FlutterFlowTheme.of(context).bodyMedium.fontWeight,
                      fontStyle:
                          FlutterFlowTheme.of(context).bodyMedium.fontStyle,
                    ),
                    color: FlutterFlowTheme.of(context).secondaryText,
                    letterSpacing: 0.0,
                    fontWeight:
                        FlutterFlowTheme.of(context).bodyMedium.fontWeight,
                    fontStyle:
                        FlutterFlowTheme.of(context).bodyMedium.fontStyle,
                  ),
            ),
            if (widget!.row?.labelText != widget!.row?.name)
              Text(
                'On the label: ${widget!.row?.labelText}',
                style: FlutterFlowTheme.of(context).bodySmall.override(
                      font: GoogleFonts.nunito(
                        fontWeight:
                            FlutterFlowTheme.of(context).bodySmall.fontWeight,
                        fontStyle:
                            FlutterFlowTheme.of(context).bodySmall.fontStyle,
                      ),
                      color: FlutterFlowTheme.of(context).secondaryText,
                      letterSpacing: 0.0,
                      fontWeight:
                          FlutterFlowTheme.of(context).bodySmall.fontWeight,
                      fontStyle:
                          FlutterFlowTheme.of(context).bodySmall.fontStyle,
                    ),
              ),
            Text(
              'What it is',
              style: FlutterFlowTheme.of(context).titleSmall.override(
                    font: GoogleFonts.nunito(
                      fontWeight:
                          FlutterFlowTheme.of(context).titleSmall.fontWeight,
                      fontStyle:
                          FlutterFlowTheme.of(context).titleSmall.fontStyle,
                    ),
                    letterSpacing: 0.0,
                    fontWeight:
                        FlutterFlowTheme.of(context).titleSmall.fontWeight,
                    fontStyle:
                        FlutterFlowTheme.of(context).titleSmall.fontStyle,
                  ),
            ),
            Text(
              widget!.row!.whatItIs,
              style: FlutterFlowTheme.of(context).bodyMedium.override(
                    font: GoogleFonts.nunito(
                      fontWeight:
                          FlutterFlowTheme.of(context).bodyMedium.fontWeight,
                      fontStyle:
                          FlutterFlowTheme.of(context).bodyMedium.fontStyle,
                    ),
                    letterSpacing: 0.0,
                    fontWeight:
                        FlutterFlowTheme.of(context).bodyMedium.fontWeight,
                    fontStyle:
                        FlutterFlowTheme.of(context).bodyMedium.fontStyle,
                  ),
            ),
            if (widget!.row?.whyUsed != '')
              Text(
                'Why it’s used',
                style: FlutterFlowTheme.of(context).titleSmall.override(
                      font: GoogleFonts.nunito(
                        fontWeight:
                            FlutterFlowTheme.of(context).titleSmall.fontWeight,
                        fontStyle:
                            FlutterFlowTheme.of(context).titleSmall.fontStyle,
                      ),
                      letterSpacing: 0.0,
                      fontWeight:
                          FlutterFlowTheme.of(context).titleSmall.fontWeight,
                      fontStyle:
                          FlutterFlowTheme.of(context).titleSmall.fontStyle,
                    ),
              ),
            if (widget!.row?.whyUsed != '')
              Text(
                widget!.row!.whyUsed,
                style: FlutterFlowTheme.of(context).bodyMedium.override(
                      font: GoogleFonts.nunito(
                        fontWeight:
                            FlutterFlowTheme.of(context).bodyMedium.fontWeight,
                        fontStyle:
                            FlutterFlowTheme.of(context).bodyMedium.fontStyle,
                      ),
                      letterSpacing: 0.0,
                      fontWeight:
                          FlutterFlowTheme.of(context).bodyMedium.fontWeight,
                      fontStyle:
                          FlutterFlowTheme.of(context).bodyMedium.fontStyle,
                    ),
              ),
            Text(
              'Benefits and risks',
              style: FlutterFlowTheme.of(context).titleSmall.override(
                    font: GoogleFonts.nunito(
                      fontWeight:
                          FlutterFlowTheme.of(context).titleSmall.fontWeight,
                      fontStyle:
                          FlutterFlowTheme.of(context).titleSmall.fontStyle,
                    ),
                    letterSpacing: 0.0,
                    fontWeight:
                        FlutterFlowTheme.of(context).titleSmall.fontWeight,
                    fontStyle:
                        FlutterFlowTheme.of(context).titleSmall.fontStyle,
                  ),
            ),
            Text(
              widget!.row!.benefitsRisks,
              style: FlutterFlowTheme.of(context).bodyMedium.override(
                    font: GoogleFonts.nunito(
                      fontWeight:
                          FlutterFlowTheme.of(context).bodyMedium.fontWeight,
                      fontStyle:
                          FlutterFlowTheme.of(context).bodyMedium.fontStyle,
                    ),
                    letterSpacing: 0.0,
                    fontWeight:
                        FlutterFlowTheme.of(context).bodyMedium.fontWeight,
                    fontStyle:
                        FlutterFlowTheme.of(context).bodyMedium.fontStyle,
                  ),
            ),
            if ((widget!.petName != '') && (widget!.row?.relevance != ''))
              Text(
                'For ${widget!.petName}',
                style: FlutterFlowTheme.of(context).titleSmall.override(
                      font: GoogleFonts.nunito(
                        fontWeight:
                            FlutterFlowTheme.of(context).titleSmall.fontWeight,
                        fontStyle:
                            FlutterFlowTheme.of(context).titleSmall.fontStyle,
                      ),
                      letterSpacing: 0.0,
                      fontWeight:
                          FlutterFlowTheme.of(context).titleSmall.fontWeight,
                      fontStyle:
                          FlutterFlowTheme.of(context).titleSmall.fontStyle,
                    ),
              ),
            if ((widget!.petName != '') && (widget!.row?.relevance != ''))
              Text(
                widget!.row!.relevance,
                style: FlutterFlowTheme.of(context).bodyMedium.override(
                      font: GoogleFonts.nunito(
                        fontWeight:
                            FlutterFlowTheme.of(context).bodyMedium.fontWeight,
                        fontStyle:
                            FlutterFlowTheme.of(context).bodyMedium.fontStyle,
                      ),
                      letterSpacing: 0.0,
                      fontWeight:
                          FlutterFlowTheme.of(context).bodyMedium.fontWeight,
                      fontStyle:
                          FlutterFlowTheme.of(context).bodyMedium.fontStyle,
                    ),
              ),
            Text(
              'What isn’t known',
              style: FlutterFlowTheme.of(context).titleSmall.override(
                    font: GoogleFonts.nunito(
                      fontWeight:
                          FlutterFlowTheme.of(context).titleSmall.fontWeight,
                      fontStyle:
                          FlutterFlowTheme.of(context).titleSmall.fontStyle,
                    ),
                    letterSpacing: 0.0,
                    fontWeight:
                        FlutterFlowTheme.of(context).titleSmall.fontWeight,
                    fontStyle:
                        FlutterFlowTheme.of(context).titleSmall.fontStyle,
                  ),
            ),
            Text(
              widget!.row!.uncertainty,
              style: FlutterFlowTheme.of(context).bodyMedium.override(
                    font: GoogleFonts.nunito(
                      fontWeight:
                          FlutterFlowTheme.of(context).bodyMedium.fontWeight,
                      fontStyle:
                          FlutterFlowTheme.of(context).bodyMedium.fontStyle,
                    ),
                    color: FlutterFlowTheme.of(context).secondaryText,
                    letterSpacing: 0.0,
                    fontWeight:
                        FlutterFlowTheme.of(context).bodyMedium.fontWeight,
                    fontStyle:
                        FlutterFlowTheme.of(context).bodyMedium.fontStyle,
                  ),
            ),
            if (widget!.row?.checksText != '')
              Text(
                widget!.row!.checksText,
                style: FlutterFlowTheme.of(context).bodySmall.override(
                      font: GoogleFonts.nunito(
                        fontWeight:
                            FlutterFlowTheme.of(context).bodySmall.fontWeight,
                        fontStyle:
                            FlutterFlowTheme.of(context).bodySmall.fontStyle,
                      ),
                      color: FlutterFlowTheme.of(context).secondaryText,
                      letterSpacing: 0.0,
                      fontWeight:
                          FlutterFlowTheme.of(context).bodySmall.fontWeight,
                      fontStyle:
                          FlutterFlowTheme.of(context).bodySmall.fontStyle,
                    ),
              ),
            if (widget!.row!.children.length > 0)
              Text(
                'In this blend',
                style: FlutterFlowTheme.of(context).titleSmall.override(
                      font: GoogleFonts.nunito(
                        fontWeight:
                            FlutterFlowTheme.of(context).titleSmall.fontWeight,
                        fontStyle:
                            FlutterFlowTheme.of(context).titleSmall.fontStyle,
                      ),
                      letterSpacing: 0.0,
                      fontWeight:
                          FlutterFlowTheme.of(context).titleSmall.fontWeight,
                      fontStyle:
                          FlutterFlowTheme.of(context).titleSmall.fontStyle,
                    ),
              ),
            Builder(
              builder: (context) {
                final childItem = widget!.row?.children?.toList() ?? [];

                return ListView.separated(
                  padding: EdgeInsets.zero,
                  primary: false,
                  shrinkWrap: true,
                  scrollDirection: Axis.vertical,
                  itemCount: childItem.length,
                  separatorBuilder: (_, __) => SizedBox(height: 8.0),
                  itemBuilder: (context, childItemIndex) {
                    final childItemItem = childItem[childItemIndex];
                    return Row(
                      mainAxisSize: MainAxisSize.max,
                      mainAxisAlignment:
                          (FFMainAxisAlignment.start).flutterValue,
                      crossAxisAlignment:
                          (FFCrossAxisAlignment.center).flutterValue,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Container(
                          width: 10.0,
                          height: 10.0,
                          decoration: BoxDecoration(
                            color: childItemItem.color == 'green'
                                ? FlutterFlowTheme.of(context).success
                                : (childItemItem.color == 'yellow'
                                    ? FlutterFlowTheme.of(context).warning
                                    : (childItemItem.color == 'red'
                                        ? FlutterFlowTheme.of(context).error
                                        : FlutterFlowTheme.of(context).slate)),
                            shape: BoxShape.circle,
                          ),
                        ),
                        Expanded(
                          child: Column(
                            mainAxisSize: MainAxisSize.max,
                            mainAxisAlignment:
                                (FFMainAxisAlignment.start).flutterValue,
                            crossAxisAlignment:
                                (FFCrossAxisAlignment.start).flutterValue,
                            textBaseline: TextBaseline.alphabetic,
                            children: [
                              Text(
                                childItemItem.name,
                                style: FlutterFlowTheme.of(context)
                                    .bodyMedium
                                    .override(
                                      font: GoogleFonts.nunito(
                                        fontWeight: FlutterFlowTheme.of(context)
                                            .bodyMedium
                                            .fontWeight,
                                        fontStyle: FlutterFlowTheme.of(context)
                                            .bodyMedium
                                            .fontStyle,
                                      ),
                                      letterSpacing: 0.0,
                                      fontWeight: FlutterFlowTheme.of(context)
                                          .bodyMedium
                                          .fontWeight,
                                      fontStyle: FlutterFlowTheme.of(context)
                                          .bodyMedium
                                          .fontStyle,
                                    ),
                              ),
                              Text(
                                '${childItemItem.role} · ${childItemItem.reason}',
                                style: FlutterFlowTheme.of(context)
                                    .bodySmall
                                    .override(
                                      font: GoogleFonts.nunito(
                                        fontWeight: FlutterFlowTheme.of(context)
                                            .bodySmall
                                            .fontWeight,
                                        fontStyle: FlutterFlowTheme.of(context)
                                            .bodySmall
                                            .fontStyle,
                                      ),
                                      color: FlutterFlowTheme.of(context)
                                          .secondaryText,
                                      letterSpacing: 0.0,
                                      fontWeight: FlutterFlowTheme.of(context)
                                          .bodySmall
                                          .fontWeight,
                                      fontStyle: FlutterFlowTheme.of(context)
                                          .bodySmall
                                          .fontStyle,
                                    ),
                              ),
                              if ((childItemItem.labelText != '') &&
                                  (childItemItem.labelText !=
                                      childItemItem.name))
                                Text(
                                  'On the label: ${childItemItem.labelText}',
                                  style: FlutterFlowTheme.of(context)
                                      .bodySmall
                                      .override(
                                        font: GoogleFonts.nunito(
                                          fontWeight:
                                              FlutterFlowTheme.of(context)
                                                  .bodySmall
                                                  .fontWeight,
                                          fontStyle:
                                              FlutterFlowTheme.of(context)
                                                  .bodySmall
                                                  .fontStyle,
                                        ),
                                        color: FlutterFlowTheme.of(context)
                                            .secondaryText,
                                        letterSpacing: 0.0,
                                        fontWeight: FlutterFlowTheme.of(context)
                                            .bodySmall
                                            .fontWeight,
                                        fontStyle: FlutterFlowTheme.of(context)
                                            .bodySmall
                                            .fontStyle,
                                      ),
                                ),
                              if (childItemItem.checksText != '')
                                Text(
                                  childItemItem.checksText,
                                  style: FlutterFlowTheme.of(context)
                                      .bodySmall
                                      .override(
                                        font: GoogleFonts.nunito(
                                          fontWeight:
                                              FlutterFlowTheme.of(context)
                                                  .bodySmall
                                                  .fontWeight,
                                          fontStyle:
                                              FlutterFlowTheme.of(context)
                                                  .bodySmall
                                                  .fontStyle,
                                        ),
                                        color: FlutterFlowTheme.of(context)
                                            .secondaryText,
                                        letterSpacing: 0.0,
                                        fontWeight: FlutterFlowTheme.of(context)
                                            .bodySmall
                                            .fontWeight,
                                        fontStyle: FlutterFlowTheme.of(context)
                                            .bodySmall
                                            .fontStyle,
                                      ),
                                ),
                              Builder(
                                builder: (context) {
                                  final childSource =
                                      childItemItem.sources.toList();

                                  return ListView.separated(
                                    padding: EdgeInsets.zero,
                                    primary: false,
                                    shrinkWrap: true,
                                    scrollDirection: Axis.vertical,
                                    itemCount: childSource.length,
                                    separatorBuilder: (_, __) =>
                                        SizedBox(height: 4.0),
                                    itemBuilder: (context, childSourceIndex) {
                                      final childSourceItem =
                                          childSource[childSourceIndex];
                                      return InkWell(
                                        splashColor: Colors.transparent,
                                        focusColor: Colors.transparent,
                                        hoverColor: Colors.transparent,
                                        highlightColor: Colors.transparent,
                                        onTap: () async {
                                          await launchURL(childSourceItem.url);
                                        },
                                        child: Text(
                                          childSourceItem.label,
                                          style: FlutterFlowTheme.of(context)
                                              .bodySmall
                                              .override(
                                                font: GoogleFonts.nunito(
                                                  fontWeight:
                                                      FlutterFlowTheme.of(
                                                              context)
                                                          .bodySmall
                                                          .fontWeight,
                                                  fontStyle:
                                                      FlutterFlowTheme.of(
                                                              context)
                                                          .bodySmall
                                                          .fontStyle,
                                                ),
                                                color:
                                                    FlutterFlowTheme.of(context)
                                                        .primary,
                                                letterSpacing: 0.0,
                                                fontWeight:
                                                    FlutterFlowTheme.of(context)
                                                        .bodySmall
                                                        .fontWeight,
                                                fontStyle:
                                                    FlutterFlowTheme.of(context)
                                                        .bodySmall
                                                        .fontStyle,
                                              ),
                                        ),
                                      );
                                    },
                                  );
                                },
                              ),
                            ].divide(SizedBox(height: 2.0)),
                          ),
                        ),
                      ].divide(SizedBox(width: 10.0)),
                    );
                  },
                );
              },
            ),
            if (widget!.row!.sources.length > 0)
              Text(
                'Sources',
                style: FlutterFlowTheme.of(context).titleSmall.override(
                      font: GoogleFonts.nunito(
                        fontWeight:
                            FlutterFlowTheme.of(context).titleSmall.fontWeight,
                        fontStyle:
                            FlutterFlowTheme.of(context).titleSmall.fontStyle,
                      ),
                      letterSpacing: 0.0,
                      fontWeight:
                          FlutterFlowTheme.of(context).titleSmall.fontWeight,
                      fontStyle:
                          FlutterFlowTheme.of(context).titleSmall.fontStyle,
                    ),
              ),
            Builder(
              builder: (context) {
                final sourceItem = widget!.row?.sources?.toList() ?? [];

                return ListView.separated(
                  padding: EdgeInsets.zero,
                  primary: false,
                  shrinkWrap: true,
                  scrollDirection: Axis.vertical,
                  itemCount: sourceItem.length,
                  separatorBuilder: (_, __) => SizedBox(height: 12.0),
                  itemBuilder: (context, sourceItemIndex) {
                    final sourceItemItem = sourceItem[sourceItemIndex];
                    return Column(
                      mainAxisSize: MainAxisSize.max,
                      mainAxisAlignment:
                          (FFMainAxisAlignment.start).flutterValue,
                      crossAxisAlignment:
                          (FFCrossAxisAlignment.start).flutterValue,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Text(
                          sourceItemItem.claim,
                          style:
                              FlutterFlowTheme.of(context).bodyMedium.override(
                                    font: GoogleFonts.nunito(
                                      fontWeight: FlutterFlowTheme.of(context)
                                          .bodyMedium
                                          .fontWeight,
                                      fontStyle: FlutterFlowTheme.of(context)
                                          .bodyMedium
                                          .fontStyle,
                                    ),
                                    letterSpacing: 0.0,
                                    fontWeight: FlutterFlowTheme.of(context)
                                        .bodyMedium
                                        .fontWeight,
                                    fontStyle: FlutterFlowTheme.of(context)
                                        .bodyMedium
                                        .fontStyle,
                                  ),
                        ),
                        if (sourceItemItem.passage != '')
                          Text(
                            '“${sourceItemItem.passage}”',
                            style:
                                FlutterFlowTheme.of(context).bodySmall.override(
                                      font: GoogleFonts.nunito(
                                        fontWeight: FlutterFlowTheme.of(context)
                                            .bodySmall
                                            .fontWeight,
                                        fontStyle: FlutterFlowTheme.of(context)
                                            .bodySmall
                                            .fontStyle,
                                      ),
                                      color: FlutterFlowTheme.of(context)
                                          .secondaryText,
                                      letterSpacing: 0.0,
                                      fontWeight: FlutterFlowTheme.of(context)
                                          .bodySmall
                                          .fontWeight,
                                      fontStyle: FlutterFlowTheme.of(context)
                                          .bodySmall
                                          .fontStyle,
                                    ),
                          ),
                        InkWell(
                          splashColor: Colors.transparent,
                          focusColor: Colors.transparent,
                          hoverColor: Colors.transparent,
                          highlightColor: Colors.transparent,
                          onTap: () async {
                            await launchURL(sourceItemItem.url);
                          },
                          child: Text(
                            sourceItemItem.label,
                            style: FlutterFlowTheme.of(context)
                                .bodySmall
                                .override(
                                  font: GoogleFonts.nunito(
                                    fontWeight: FlutterFlowTheme.of(context)
                                        .bodySmall
                                        .fontWeight,
                                    fontStyle: FlutterFlowTheme.of(context)
                                        .bodySmall
                                        .fontStyle,
                                  ),
                                  color: FlutterFlowTheme.of(context).primary,
                                  letterSpacing: 0.0,
                                  fontWeight: FlutterFlowTheme.of(context)
                                      .bodySmall
                                      .fontWeight,
                                  fontStyle: FlutterFlowTheme.of(context)
                                      .bodySmall
                                      .fontStyle,
                                ),
                          ),
                        ),
                      ].divide(SizedBox(height: 2.0)),
                    );
                  },
                );
              },
            ),
            Text(
              'Checked against its sources by Purrbi’s automated checks; not reviewed by a veterinarian. Educational information, not veterinary advice.',
              style: FlutterFlowTheme.of(context).bodySmall.override(
                    font: GoogleFonts.nunito(
                      fontWeight:
                          FlutterFlowTheme.of(context).bodySmall.fontWeight,
                      fontStyle:
                          FlutterFlowTheme.of(context).bodySmall.fontStyle,
                    ),
                    color: FlutterFlowTheme.of(context).secondaryText,
                    letterSpacing: 0.0,
                    fontWeight:
                        FlutterFlowTheme.of(context).bodySmall.fontWeight,
                    fontStyle: FlutterFlowTheme.of(context).bodySmall.fontStyle,
                  ),
            ),
          ].divide(SizedBox(height: 8.0)),
        ),
      ),
    );
  }
}
