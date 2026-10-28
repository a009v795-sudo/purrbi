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