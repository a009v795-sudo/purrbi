// Automatic FlutterFlow imports
import '/backend/backend.dart';
import '/backend/schema/structs/index.dart';
import '/flutter_flow/ff_builtin_enums.dart';
import '/actions/actions.dart' as action_blocks;
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/custom_code/actions/index.dart'; // Imports other custom actions
import '/flutter_flow/custom_functions.dart'; // Imports custom functions
import 'package:flutter/material.dart' hide RepeatMode;
// Begin custom action code
// DO NOT REMOVE OR MODIFY THE CODE ABOVE!

String getCurrencySymbol(String currencyCode) {
  switch (currencyCode) {
    case 'USD':
      return '\$'; // US Dollar
    case 'NGN':
      return '₦'; // Nigerian Naira
    case 'AUD':
      return 'A\$'; // Australian Dollar
    case 'CAD':
      return 'C\$'; // Canadian Dollar
    case 'CHF':
      return 'CHF'; // Swiss Franc
    case 'CNY':
      return '¥'; // Chinese Yuan
    case 'SGD':
      return 'S\$'; // Singapore Dollar
    case 'EUR':
      return '€'; // Euro
    case 'GBP':
      return '£'; // British Pound
    case 'GHS':
      return '₵'; // Ghanaian Cedi
    case 'GHC':
      return '₵'; // Ghanaian Cedi
    case 'JPY':
      return '¥'; // Japanese Yen
    case 'AFN':
      return '؋'; // Afghan Afghani
    case 'ILS':
      return '₪'; // Israeli Shekel
    case 'INR':
      return '₹'; // Indian Rupee
    case 'ZAR':
      return 'R'; // South African Rand
    case 'RUB':
      return '₽'; // Russian Ruble
    case 'CZK':
      return 'Kč'; // Czech Koruna
    case 'KRW':
      return '₩'; // South Korean Won
    case 'PHP':
      return '₱'; // Philippine Peso
    case 'PLN':
      return 'zł'; // Polish Zloty
    case 'THB':
      return '฿'; // Thai Baht
    case 'VND':
      return '₫'; // Vietnamese Dong
    case 'BTC':
      return '₿'; // Bitcoin
    case 'AMD':
      return '֏'; // Armenian Dram
    default:
      return ''; // Unsupported currency
  }
}

// Set your action name, define your arguments and return parameter,
// and then add the boilerplate code using the green button on the right!
