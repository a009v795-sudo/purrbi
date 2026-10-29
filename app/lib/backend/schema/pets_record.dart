import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

/// Collection pets
class PetsRecord extends FirestoreRecord {
  PetsRecord._(
    DocumentReference reference,
    Map<String, dynamic> data,
  ) : super(reference, data) {
    _initializeFields();
  }

  // "name" field.
  String? _name;
  String get name => _name ?? '';
  bool hasName() => _name != null;

  // "species" field.
  String? _species;
  String get species => _species ?? '';
  bool hasSpecies() => _species != null;

  // "breed" field.
  String? _breed;
  String get breed => _breed ?? '';
  bool hasBreed() => _breed != null;

  // "breedType" field.
  String? _breedType;
  String get breedType => _breedType ?? '';
  bool hasBreedType() => _breedType != null;

  // "birthDate" field.
  DateTime? _birthDate;
  DateTime? get birthDate => _birthDate;
  bool hasBirthDate() => _birthDate != null;

  // "approxAgeMonths" field.
  int? _approxAgeMonths;
  int get approxAgeMonths => _approxAgeMonths ?? 0;
  bool hasApproxAgeMonths() => _approxAgeMonths != null;

  // "ageCapturedAt" field.
  DateTime? _ageCapturedAt;
  DateTime? get ageCapturedAt => _ageCapturedAt;
  bool hasAgeCapturedAt() => _ageCapturedAt != null;

  // "weightKg" field.
  double? _weightKg;
  double get weightKg => _weightKg ?? 0.0;
  bool hasWeightKg() => _weightKg != null;

  // "weightValue" field.
  double? _weightValue;
  double get weightValue => _weightValue ?? 0.0;
  bool hasWeightValue() => _weightValue != null;

  // "weightUnit" field.
  String? _weightUnit;
  String get weightUnit => _weightUnit ?? '';
  bool hasWeightUnit() => _weightUnit != null;

  // "sex" field.
  String? _sex;
  String get sex => _sex ?? '';
  bool hasSex() => _sex != null;

  // "neutered" field.
  String? _neutered;
  String get neutered => _neutered ?? '';
  bool hasNeutered() => _neutered != null;

  // "reproductiveStatus" field.
  String? _reproductiveStatus;
  String get reproductiveStatus => _reproductiveStatus ?? '';
  bool hasReproductiveStatus() => _reproductiveStatus != null;

  // "expectedAdultSize" field.
  String? _expectedAdultSize;
  String get expectedAdultSize => _expectedAdultSize ?? '';
  bool hasExpectedAdultSize() => _expectedAdultSize != null;

  // "allergiesStatus" field.
  String? _allergiesStatus;
  String get allergiesStatus => _allergiesStatus ?? '';
  bool hasAllergiesStatus() => _allergiesStatus != null;

  // "allergies" field.
  List<String>? _allergies;
  List<String> get allergies => _allergies ?? const [];
  bool hasAllergies() => _allergies != null;

  // "sensitivitiesStatus" field.
  String? _sensitivitiesStatus;
  String get sensitivitiesStatus => _sensitivitiesStatus ?? '';
  bool hasSensitivitiesStatus() => _sensitivitiesStatus != null;

  // "sensitivities" field.
  List<String>? _sensitivities;
  List<String> get sensitivities => _sensitivities ?? const [];
  bool hasSensitivities() => _sensitivities != null;

  // "vetDietStatus" field.
  String? _vetDietStatus;
  String get vetDietStatus => _vetDietStatus ?? '';
  bool hasVetDietStatus() => _vetDietStatus != null;

  // "vetDietNotes" field.
  String? _vetDietNotes;
  String get vetDietNotes => _vetDietNotes ?? '';
  bool hasVetDietNotes() => _vetDietNotes != null;

  // "conditionsStatus" field.
  String? _conditionsStatus;
  String get conditionsStatus => _conditionsStatus ?? '';
  bool hasConditionsStatus() => _conditionsStatus != null;

  // "conditions" field.
  List<String>? _conditions;
  List<String> get conditions => _conditions ?? const [];
  bool hasConditions() => _conditions != null;

  // "medicationsStatus" field.
  String? _medicationsStatus;
  String get medicationsStatus => _medicationsStatus ?? '';
  bool hasMedicationsStatus() => _medicationsStatus != null;

  // "avoidIngredients" field.
  List<String>? _avoidIngredients;
  List<String> get avoidIngredients => _avoidIngredients ?? const [];
  bool hasAvoidIngredients() => _avoidIngredients != null;

  // "goals" field.
  List<String>? _goals;
  List<String> get goals => _goals ?? const [];
  bool hasGoals() => _goals != null;

  // "preferences" field.
  List<String>? _preferences;
  List<String> get preferences => _preferences ?? const [];
  bool hasPreferences() => _preferences != null;

  // "photoUrl" field.
  String? _photoUrl;
  String get photoUrl => _photoUrl ?? '';
  bool hasPhotoUrl() => _photoUrl != null;

  // "avatarColor" field.
  String? _avatarColor;
  String get avatarColor => _avatarColor ?? '';
  bool hasAvatarColor() => _avatarColor != null;

  // "profileVersion" field.
  int? _profileVersion;
  int get profileVersion => _profileVersion ?? 0;
  bool hasProfileVersion() => _profileVersion != null;

  // "onboardingStep" field.
  int? _onboardingStep;
  int get onboardingStep => _onboardingStep ?? 0;
  bool hasOnboardingStep() => _onboardingStep != null;

  // "onboardingComplete" field.
  bool? _onboardingComplete;
  bool get onboardingComplete => _onboardingComplete ?? false;
  bool hasOnboardingComplete() => _onboardingComplete != null;

  // "createdAt" field.
  DateTime? _createdAt;
  DateTime? get createdAt => _createdAt;
  bool hasCreatedAt() => _createdAt != null;

  // "updatedAt" field.
  DateTime? _updatedAt;
  DateTime? get updatedAt => _updatedAt;
  bool hasUpdatedAt() => _updatedAt != null;

  DocumentReference get parentReference => reference.parent.parent!;

  void _initializeFields() {
    _name = snapshotData['name'] as String?;
    _species = snapshotData['species'] as String?;
    _breed = snapshotData['breed'] as String?;
    _breedType = snapshotData['breedType'] as String?;
    _birthDate = snapshotData['birthDate'] as DateTime?;
    _approxAgeMonths = castToType<int>(snapshotData['approxAgeMonths']);
    _ageCapturedAt = snapshotData['ageCapturedAt'] as DateTime?;
    _weightKg = castToType<double>(snapshotData['weightKg']);
    _weightValue = castToType<double>(snapshotData['weightValue']);
    _weightUnit = snapshotData['weightUnit'] as String?;
    _sex = snapshotData['sex'] as String?;
    _neutered = snapshotData['neutered'] as String?;
    _reproductiveStatus = snapshotData['reproductiveStatus'] as String?;
    _expectedAdultSize = snapshotData['expectedAdultSize'] as String?;
    _allergiesStatus = snapshotData['allergiesStatus'] as String?;
    _allergies = getDataList(snapshotData['allergies']);
    _sensitivitiesStatus = snapshotData['sensitivitiesStatus'] as String?;
    _sensitivities = getDataList(snapshotData['sensitivities']);
    _vetDietStatus = snapshotData['vetDietStatus'] as String?;
    _vetDietNotes = snapshotData['vetDietNotes'] as String?;
    _conditionsStatus = snapshotData['conditionsStatus'] as String?;
    _conditions = getDataList(snapshotData['conditions']);
    _medicationsStatus = snapshotData['medicationsStatus'] as String?;
    _avoidIngredients = getDataList(snapshotData['avoidIngredients']);
    _goals = getDataList(snapshotData['goals']);
    _preferences = getDataList(snapshotData['preferences']);
    _photoUrl = snapshotData['photoUrl'] as String?;
    _avatarColor = snapshotData['avatarColor'] as String?;
    _profileVersion = castToType<int>(snapshotData['profileVersion']);
    _onboardingStep = castToType<int>(snapshotData['onboardingStep']);
    _onboardingComplete = snapshotData['onboardingComplete'] as bool?;
    _createdAt = snapshotData['createdAt'] as DateTime?;
    _updatedAt = snapshotData['updatedAt'] as DateTime?;
  }

  static Query<Map<String, dynamic>> collection([DocumentReference? parent]) =>
      parent != null
          ? parent.collection('pets')
          : FirebaseFirestore.instance.collectionGroup('pets');

  static DocumentReference createDoc(DocumentReference parent, {String? id}) =>
      parent.collection('pets').doc(id);

  static Stream<PetsRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => PetsRecord.fromSnapshot(s));

  static Future<PetsRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then((s) => PetsRecord.fromSnapshot(s));

  static PetsRecord fromSnapshot(DocumentSnapshot snapshot) => PetsRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static PetsRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      PetsRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'PetsRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is PetsRecord && reference.path == other.reference.path;
}

Map<String, dynamic> createPetsRecordData({
  String? name,
  String? species,
  String? breed,
  String? breedType,
  DateTime? birthDate,
  int? approxAgeMonths,
  DateTime? ageCapturedAt,
  double? weightKg,
  double? weightValue,
  String? weightUnit,
  String? sex,
  String? neutered,
  String? reproductiveStatus,
  String? expectedAdultSize,
  String? allergiesStatus,
  String? sensitivitiesStatus,
  String? vetDietStatus,
  String? vetDietNotes,
  String? conditionsStatus,
  String? medicationsStatus,
  String? photoUrl,
  String? avatarColor,
  int? profileVersion,
  int? onboardingStep,
  bool? onboardingComplete,
  DateTime? createdAt,
  DateTime? updatedAt,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'name': name,
      'species': species,
      'breed': breed,
      'breedType': breedType,
      'birthDate': birthDate,
      'approxAgeMonths': approxAgeMonths,
      'ageCapturedAt': ageCapturedAt,
      'weightKg': weightKg,
      'weightValue': weightValue,
      'weightUnit': weightUnit,
      'sex': sex,
      'neutered': neutered,
      'reproductiveStatus': reproductiveStatus,
      'expectedAdultSize': expectedAdultSize,
      'allergiesStatus': allergiesStatus,
      'sensitivitiesStatus': sensitivitiesStatus,
      'vetDietStatus': vetDietStatus,
      'vetDietNotes': vetDietNotes,
      'conditionsStatus': conditionsStatus,
      'medicationsStatus': medicationsStatus,
      'photoUrl': photoUrl,
      'avatarColor': avatarColor,
      'profileVersion': profileVersion,
      'onboardingStep': onboardingStep,
      'onboardingComplete': onboardingComplete,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    }.withoutNulls,
  );

  return firestoreData;
}

class PetsRecordDocumentEquality implements Equality<PetsRecord> {
  const PetsRecordDocumentEquality();

  @override
  bool equals(PetsRecord? e1, PetsRecord? e2) {
    const listEquality = ListEquality();
    return e1?.name == e2?.name &&
        e1?.species == e2?.species &&
        e1?.breed == e2?.breed &&
        e1?.breedType == e2?.breedType &&
        e1?.birthDate == e2?.birthDate &&
        e1?.approxAgeMonths == e2?.approxAgeMonths &&
        e1?.ageCapturedAt == e2?.ageCapturedAt &&
        e1?.weightKg == e2?.weightKg &&
        e1?.weightValue == e2?.weightValue &&
        e1?.weightUnit == e2?.weightUnit &&
        e1?.sex == e2?.sex &&
        e1?.neutered == e2?.neutered &&
        e1?.reproductiveStatus == e2?.reproductiveStatus &&
        e1?.expectedAdultSize == e2?.expectedAdultSize &&
        e1?.allergiesStatus == e2?.allergiesStatus &&
        listEquality.equals(e1?.allergies, e2?.allergies) &&
        e1?.sensitivitiesStatus == e2?.sensitivitiesStatus &&
        listEquality.equals(e1?.sensitivities, e2?.sensitivities) &&
        e1?.vetDietStatus == e2?.vetDietStatus &&
        e1?.vetDietNotes == e2?.vetDietNotes &&
        e1?.conditionsStatus == e2?.conditionsStatus &&
        listEquality.equals(e1?.conditions, e2?.conditions) &&
        e1?.medicationsStatus == e2?.medicationsStatus &&
        listEquality.equals(e1?.avoidIngredients, e2?.avoidIngredients) &&
        listEquality.equals(e1?.goals, e2?.goals) &&
        listEquality.equals(e1?.preferences, e2?.preferences) &&
        e1?.photoUrl == e2?.photoUrl &&
        e1?.avatarColor == e2?.avatarColor &&
        e1?.profileVersion == e2?.profileVersion &&
        e1?.onboardingStep == e2?.onboardingStep &&
        e1?.onboardingComplete == e2?.onboardingComplete &&
        e1?.createdAt == e2?.createdAt &&
        e1?.updatedAt == e2?.updatedAt;
  }

  @override
  int hash(PetsRecord? e) => const ListEquality().hash([
        e?.name,
        e?.species,
        e?.breed,
        e?.breedType,
        e?.birthDate,
        e?.approxAgeMonths,
        e?.ageCapturedAt,
        e?.weightKg,
        e?.weightValue,
        e?.weightUnit,
        e?.sex,
        e?.neutered,
        e?.reproductiveStatus,
        e?.expectedAdultSize,
        e?.allergiesStatus,
        const ListEquality().hash(e?.allergies),
        e?.sensitivitiesStatus,
        const ListEquality().hash(e?.sensitivities),
        e?.vetDietStatus,
        e?.vetDietNotes,
        e?.conditionsStatus,
        const ListEquality().hash(e?.conditions),
        e?.medicationsStatus,
        const ListEquality().hash(e?.avoidIngredients),
        const ListEquality().hash(e?.goals),
        const ListEquality().hash(e?.preferences),
        e?.photoUrl,
        e?.avatarColor,
        e?.profileVersion,
        e?.onboardingStep,
        e?.onboardingComplete,
        e?.createdAt,
        e?.updatedAt
      ]);

  @override
  bool isValidKey(Object? o) => o is PetsRecord;
}
