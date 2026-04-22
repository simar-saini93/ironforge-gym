// Major world currencies including Central & South American
export const CURRENCIES = [
  // Asia
  { code: 'INR', symbol: '₹',  name: 'Indian Rupee'           },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham'             },
  { code: 'SAR', symbol: '﷼',  name: 'Saudi Riyal'            },
  { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal'          },
  { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar'         },
  { code: 'BHD', symbol: 'BD',  name: 'Bahraini Dinar'        },
  { code: 'OMR', symbol: 'ر.ع', name: 'Omani Rial'            },
  { code: 'PKR', symbol: '₨',  name: 'Pakistani Rupee'        },
  { code: 'BDT', symbol: '৳',  name: 'Bangladeshi Taka'       },
  { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee'       },
  { code: 'NPR', symbol: '₨',  name: 'Nepalese Rupee'         },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar'       },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit'      },
  { code: 'THB', symbol: '฿',  name: 'Thai Baht'              },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah'      },
  { code: 'PHP', symbol: '₱',  name: 'Philippine Peso'        },
  { code: 'VND', symbol: '₫',  name: 'Vietnamese Dong'        },
  { code: 'CNY', symbol: '¥',  name: 'Chinese Yuan'           },
  { code: 'JPY', symbol: '¥',  name: 'Japanese Yen'           },
  { code: 'KRW', symbol: '₩',  name: 'South Korean Won'       },
  { code: 'HKD', symbol: 'HK$',name: 'Hong Kong Dollar'       },
  { code: 'TWD', symbol: 'NT$',name: 'Taiwan Dollar'          },

  // Europe
  { code: 'EUR', symbol: '€',  name: 'Euro'                   },
  { code: 'GBP', symbol: '£',  name: 'British Pound'          },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc'            },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona'          },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone'        },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone'           },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty'           },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna'           },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint'       },
  { code: 'RON', symbol: 'lei',name: 'Romanian Leu'           },
  { code: 'TRY', symbol: '₺',  name: 'Turkish Lira'           },
  { code: 'RUB', symbol: '₽',  name: 'Russian Ruble'          },
  { code: 'UAH', symbol: '₴',  name: 'Ukrainian Hryvnia'      },

  // Americas — North
  { code: 'USD', symbol: '$',  name: 'US Dollar'              },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar'        },
  { code: 'MXN', symbol: '$',  name: 'Mexican Peso'           },

  // Americas — Central
  { code: 'BZD', symbol: 'BZ$',name: 'Belize Dollar'         },
  { code: 'GTQ', symbol: 'Q',  name: 'Guatemalan Quetzal'    },
  { code: 'HNL', symbol: 'L',  name: 'Honduran Lempira'      },
  { code: 'NIO', symbol: 'C$', name: 'Nicaraguan Córdoba'    },
  { code: 'CRC', symbol: '₡',  name: 'Costa Rican Colón'     },
  { code: 'PAB', symbol: 'B/.',name: 'Panamanian Balboa'     },
  { code: 'DOP', symbol: 'RD$',name: 'Dominican Peso'        },
  { code: 'HTG', symbol: 'G',  name: 'Haitian Gourde'        },
  { code: 'JMD', symbol: 'J$', name: 'Jamaican Dollar'       },
  { code: 'TTD', symbol: 'TT$',name: 'Trinidad & Tobago Dollar'},
  { code: 'BBD', symbol: 'Bds$',name:'Barbadian Dollar'      },
  { code: 'XCD', symbol: 'EC$',name: 'East Caribbean Dollar' },
  { code: 'CUP', symbol: '₱',  name: 'Cuban Peso'            },

  // Americas — South
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real'        },
  { code: 'ARS', symbol: '$',  name: 'Argentine Peso'        },
  { code: 'CLP', symbol: '$',  name: 'Chilean Peso'          },
  { code: 'COP', symbol: '$',  name: 'Colombian Peso'        },
  { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol'          },
  { code: 'VES', symbol: 'Bs.',name: 'Venezuelan Bolívar'    },
  { code: 'BOB', symbol: 'Bs.',name: 'Bolivian Boliviano'    },
  { code: 'PYG', symbol: '₲',  name: 'Paraguayan Guaraní'   },
  { code: 'UYU', symbol: '$U', name: 'Uruguayan Peso'        },
  { code: 'GYD', symbol: '$',  name: 'Guyanese Dollar'       },
  { code: 'SRD', symbol: '$',  name: 'Surinamese Dollar'     },
  { code: 'FKP', symbol: '£',  name: 'Falkland Islands Pound'},
  { code: 'AWG', symbol: 'ƒ',  name: 'Aruban Florin'        },

  // Africa
  { code: 'ZAR', symbol: 'R',  name: 'South African Rand'    },
  { code: 'NGN', symbol: '₦',  name: 'Nigerian Naira'        },
  { code: 'KES', symbol: 'KSh',name: 'Kenyan Shilling'       },
  { code: 'GHS', symbol: 'GH₵',name: 'Ghanaian Cedi'        },
  { code: 'EGP', symbol: '£',  name: 'Egyptian Pound'        },
  { code: 'MAD', symbol: 'MAD',name: 'Moroccan Dirham'       },
  { code: 'TZS', symbol: 'TSh',name: 'Tanzanian Shilling'    },
  { code: 'UGX', symbol: 'USh',name: 'Ugandan Shilling'      },
  { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr'        },

  // Oceania
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar'     },
  { code: 'NZD', symbol: 'NZ$',name: 'New Zealand Dollar'    },
  { code: 'FJD', symbol: 'FJ$',name: 'Fijian Dollar'        },
];

export function getCurrency(code) {
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
}

export function formatCurrencyWithCode(amount, code = 'INR') {
  const cur = getCurrency(code);
  const num = Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  return `${cur.code} ${cur.symbol}${num}`;
}
