import '/auth/firebase_auth/auth_util.dart';
import '/backend/backend.dart';
import '/flutter_flow/ff_builtin_enums.dart';
import '/flutter_flow/flutter_flow_choice_chips.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/flutter_flow/form_field_controller.dart';
import 'dart:ui';
import '/flutter_flow/custom_functions.dart' as functions;
import '/index.dart';
import 'package:cloud_firestore/cloud_firestore.dart' hide Type;
import 'pet_onboarding_page_widget.dart' show PetOnboardingPageWidget;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:percent_indicator/percent_indicator.dart';
import 'package:provider/provider.dart';

class PetOnboardingPageModel extends FlutterFlowModel<PetOnboardingPageWidget> {
  ///  Local state fields for this page.

  int? step = 1;

  bool? hasDraft = false;

  DocumentReference? petRef;

  String? petName = '';

  String? species = '';

  String? sex = 'unknown';

  String? neutered = 'unknown';

  String? reproductiveStatus = 'not_provided';

  String? expectedAdultSize = 'unknown';

  String? weightUnit = 'kg';

  String? allergiesStatus = 'not_provided';

  List<String> allergies = [];
  void addToAllergies(String item) => allergies.add(item);
  void removeFromAllergies(String item) => allergies.remove(item);
  void removeAtIndexFromAllergies(int index) => allergies.removeAt(index);
  void insertAtIndexInAllergies(int index, String item) =>
      allergies.insert(index, item);
  void updateAllergiesAtIndex(int index, Function(String) updateFn) =>
      allergies[index] = updateFn(allergies[index]);

  String? vetDietStatus = 'not_provided';

  String? conditionsStatus = 'not_provided';

  String? medicationsStatus = 'not_provided';

  List<String> goals = [];
  void addToGoals(String item) => goals.add(item);
  void removeFromGoals(String item) => goals.remove(item);
  void removeAtIndexFromGoals(int index) => goals.removeAt(index);
  void insertAtIndexInGoals(int index, String item) =>
      goals.insert(index, item);
  void updateGoalsAtIndex(int index, Function(String) updateFn) =>
      goals[index] = updateFn(goals[index]);

  bool? saving = false;

  ///  State fields for stateful widgets in this page.

  // State field(s) for ChoiceChips widget.
  FormFieldController<List<String>>? choiceChipsValueController1;
  String? get choiceChipsValue1 =>
      choiceChipsValueController1?.value?.firstOrNull;
  set choiceChipsValue1(String? val) =>
      choiceChipsValueController1?.value = val != null ? [val] : [];
  // State field(s) for petNameField widget.
  FocusNode? petNameFieldFocusNode;
  TextEditingController? petNameFieldTextController;
  String? Function(BuildContext, String?)? petNameFieldTextControllerValidator;
  // State field(s) for ageYearsField widget.
  FocusNode? ageYearsFieldFocusNode;
  TextEditingController? ageYearsFieldTextController;
  String? Function(BuildContext, String?)? ageYearsFieldTextControllerValidator;
  // State field(s) for ageMonthsField widget.
  FocusNode? ageMonthsFieldFocusNode;
  TextEditingController? ageMonthsFieldTextController;
  String? Function(BuildContext, String?)?
      ageMonthsFieldTextControllerValidator;
  // State field(s) for ChoiceChips widget.
  FormFieldController<List<String>>? choiceChipsValueController2;
  String? get choiceChipsValue2 =>
      choiceChipsValueController2?.value?.firstOrNull;
  set choiceChipsValue2(String? val) =>
      choiceChipsValueController2?.value = val != null ? [val] : [];
  // State field(s) for ChoiceChips widget.
  FormFieldController<List<String>>? choiceChipsValueController3;
  String? get choiceChipsValue3 =>
      choiceChipsValueController3?.value?.firstOrNull;
  set choiceChipsValue3(String? val) =>
      choiceChipsValueController3?.value = val != null ? [val] : [];
  // State field(s) for ChoiceChips widget.
  FormFieldController<List<String>>? choiceChipsValueController4;
  String? get choiceChipsValue4 =>
      choiceChipsValueController4?.value?.firstOrNull;
  set choiceChipsValue4(String? val) =>
      choiceChipsValueController4?.value = val != null ? [val] : [];
  // State field(s) for ChoiceChips widget.
  FormFieldController<List<String>>? choiceChipsValueController5;
  String? get choiceChipsValue5 =>
      choiceChipsValueController5?.value?.firstOrNull;
  set choiceChipsValue5(String? val) =>
      choiceChipsValueController5?.value = val != null ? [val] : [];
  // State field(s) for weightField widget.
  FocusNode? weightFieldFocusNode;
  TextEditingController? weightFieldTextController;
  String? Function(BuildContext, String?)? weightFieldTextControllerValidator;
  // State field(s) for ChoiceChips widget.
  FormFieldController<List<String>>? choiceChipsValueController6;
  String? get choiceChipsValue6 =>
      choiceChipsValueController6?.value?.firstOrNull;
  set choiceChipsValue6(String? val) =>
      choiceChipsValueController6?.value = val != null ? [val] : [];
  // State field(s) for ChoiceChips widget.
  FormFieldController<List<String>>? choiceChipsValueController7;
  String? get choiceChipsValue7 =>
      choiceChipsValueController7?.value?.firstOrNull;
  set choiceChipsValue7(String? val) =>
      choiceChipsValueController7?.value = val != null ? [val] : [];
  // State field(s) for ChoiceChips widget.
  FormFieldController<List<String>>? choiceChipsValueController8;
  List<String>? get choiceChipsValues8 => choiceChipsValueController8?.value;
  set choiceChipsValues8(List<String>? val) =>
      choiceChipsValueController8?.value = val;
  // State field(s) for ChoiceChips widget.
  FormFieldController<List<String>>? choiceChipsValueController9;
  String? get choiceChipsValue9 =>
      choiceChipsValueController9?.value?.firstOrNull;
  set choiceChipsValue9(String? val) =>
      choiceChipsValueController9?.value = val != null ? [val] : [];
  // State field(s) for ChoiceChips widget.
  FormFieldController<List<String>>? choiceChipsValueController10;
  String? get choiceChipsValue10 =>
      choiceChipsValueController10?.value?.firstOrNull;
  set choiceChipsValue10(String? val) =>
      choiceChipsValueController10?.value = val != null ? [val] : [];
  // State field(s) for ChoiceChips widget.
  FormFieldController<List<String>>? choiceChipsValueController11;
  String? get choiceChipsValue11 =>
      choiceChipsValueController11?.value?.firstOrNull;
  set choiceChipsValue11(String? val) =>
      choiceChipsValueController11?.value = val != null ? [val] : [];
  // State field(s) for ChoiceChips widget.
  FormFieldController<List<String>>? choiceChipsValueController12;
  List<String>? get choiceChipsValues12 => choiceChipsValueController12?.value;
  set choiceChipsValues12(List<String>? val) =>
      choiceChipsValueController12?.value = val;
  // Stores action output result for [Backend Call - Create Document] action in Button widget.
  PetsRecord? createdPet;

  @override
  void initState(BuildContext context) {}

  @override
  void dispose() {
    petNameFieldFocusNode?.dispose();
    petNameFieldTextController?.dispose();

    ageYearsFieldFocusNode?.dispose();
    ageYearsFieldTextController?.dispose();

    ageMonthsFieldFocusNode?.dispose();
    ageMonthsFieldTextController?.dispose();

    weightFieldFocusNode?.dispose();
    weightFieldTextController?.dispose();
  }
}
