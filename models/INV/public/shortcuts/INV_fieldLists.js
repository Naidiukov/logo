_.extend(UTL.shortcuts.fieldLists, {
	
	inv_subject:{
		search:[
			{"name": "ID", "visibility": false},
            {"name": "oType", "visibility": false},
            {"name": "code", "description": "Код"},
			{"name": "oTypeStr", "description": "Тип об'єкта"},
			{"name": "koattNum.koattNum", "description": "КОАТУУ"},
			{"name": "address", "description": "Адреса"},
            {"name": "cadastralNumber", "description": "Кадастровий номер"},
            "useType",
            {"name": "totalArea", "description": "Загальна площа", "format":".0000"},
            {"name": "documentOwnership", "description": "Документ права власності"},
			{"name": "registryData", "description": "Дата держреєстрації"},
			{"name": "owner", "description": "Власник"},
			{"name": "owner.code", "description": "Власник.РНОКПП/ЄДРПОУ"},
			{"name": "koattNum.localGovernment", "description": "Орган місцевого самоврядування"},
            {"name": "ownershipArea", "description": "Заг. площа домоволодіння (м2)"}
		]
	},
	inv_landDict:{
		search:[
			{"name": "ID", "visibility": false},			
			{"name": "koattNum", "description": "КОАТУУ"},
            {"name": "governmentStatus", "description": "Статус населеного пункту"},
            {"name": "governmentName", "description": "Назва місцевого самоврядування"},
			{"name": "localGovernment", "description": "Орган місцевого самоврядування"},
            {"name": "lastYear", "description": "Рік останнього проведення нормативної грошової оцінки земель населеного пункту"},
            {"name": "NGO", "description": "НГО одиниці площі"}
		]
	},
    inv_payers:{
        search:[
            {"name": "ID", "visibility": false},
            {"name": "personType", "description": "Тип"},
            {"name": "fullName", "description": "ПІБ"},
            {"name": "code", "description": "РНОКПП/ЄДРПОУ"},
            'areaAddR',
            'regionAddR',
            'settlementAddR',
            'streetAddR',
            'houseNumAddR',
            'flatNumAddR'
        ]
    },
    inv_exemptionPhysDict:{
        search:[
            {"name": "ID", "visibility": false},
            {"name": "exemptionCat", "description": "Пільгова категорія"},
            {"name": "managingOSG", "description": "Для ведення ОСГ, Га"},
            {"name": "smallholding", "description": "Присадибна ділянка, Га"},
            {"name": "cottageConstruction", "description": "Для дачного будівництва, Га"},
            {"name": "constructionGarages", "description": "Для  будівництва інд. гаражів, Га"},
            {"name": "managingGarden", "description": "Для  ведення садівництва, Га"}
        ]
    },
    inv_exemptionLegDict:{
        search:[
            {"name": "ID", "visibility": false},
            {"name": "exemptionCat", "description": "Пільгова категорія"}
        ]
    },
    inv_calcParams:{
        search:[
            {"name": "ID", "visibility": false},
            {"name": "year", "description": "Рік"},
            {"name": "SGindex", "description": "Коефіцієнт індексації для СГ угідь"},
            {"name": "notSGindex", "description": "Коефіцієнт індексації для неСГ угідь"}
        ]
    },
    inv_calcRealtyParams:{
        search:[
            {"name": "ID", "visibility": false},
            {"name": "year", "description": "Рік"},
            {"name": "forRooms", "description": "Для госп. та допом.(нежитл) приміщень"}
        ]
    },
    inv_localRequisites:{
        search:[
            {"name": "ID", "visibility": false},
            {"name": "landDictID.localGovernment", "description": "Орган місцевого самоврядування"},
            {"name": "state", "description": "Стан"},
            {"name": "name", "description": "Назва"},
            {"name": "code", "description": "Код"},
            {"name": "MFO", "description": "МФО банку"}
        ]
    },
    inv_regIncome:{
        search:[
            {"name": "ID", "visibility": false},
            {"name": "payDate", "description": "Дата платежу"},
            {"name": "paySum", "description": "Сума платежу"},
            {"name": "payer", "description": "Платник"},
            {"name": "payPurpose", "description": "Призначення платежу"},
            {"name": "payCode", "description": "Код платежу"},
            {"name": "MFO", "description": "МФО банку"}
        ]
    },
    inv_taxRealtyPay:{
        search:[
            {"name": "ID", "visibility": false},
            {"name": "year", "description": "Рік"},
            {"name": "flat", "description": "Квартира"},
            {"name": "house", "description": "Житловий  будинок"},
            {"name": "otherRealtyObj", "description": "Інший об’єкт житлової нерухомості"}
        ]
    },
    pgo_ngoDict:{
        search:[
            {"name": "ID", "visibility": false},
            {"name": "localGovernment", "description": "Назва місцевої ради"},
            {"name": "regionName", "description": "Назва району"},
            {"name": "areaName", "description": "Назва області"}
        ]
    },
    pgo_localStreet:{
        search:[
            {"name": "ID", "visibility": false},
            {"name": "settlementDictID.governmentFullName", "description": "Назва населеного пункту"},
            {"name": "code", "description": "Код"},
			'settlementDistrictID',
            {"name": "streetType", "description": "Тип вулиці"},
            {"name": "street", "description": "Вулиця"},
            {"name": "coverageID.name", "description": "Дорожне покриття"},
            {"name": "illuminati", "description": "Освітлення"},
            {"name": "distance", "description": "Відстань", "format":".00"}
        ]
    },
    inv_leaseAgreements:{
        search:[
            {"name": "ID", "visibility": false},
            {"name": "agreeNum", "description": "№ договору"},
            {"name": "renter", "description": "Орендар"},
            {"name": "landLord", "description": "Орендодавець"},
            {"name": "startDate", "description": "Дата початку дії"},
            {"name": "endDate", "description": "Дата закінчення дії"},
            {"name": "state", "description": "Стан"},
            {"name": "rentPay", "description": "Орендна плата, грн"}
        ]
    },
    inv_objLog:{
        search:[
            {"name": "ID", "visibility": false},
            {"name": "changeDate", "description": "Дата зміни"},
            {"name": "actionType", "description": "Тип операції"},
            {"name": "oType", "description": "Тип об’єкта"},
            {"name": "landCategory", "description": "Категорія земель"},
            {"name": "landPurpose", "description": "Угіддя"},
            {"name": "cadastralNumber", "description": "Кадастровий номер"},
            {"name": "totalArea", "description": "Загальна площа"},
            {"name": "address", "description": "Адреса"},
            {"name": "documentOwnership", "description": "Документ права власності"},
            {"name": "registryData", "description": "Дата держреєстрації"},
            {"name": "owner", "description": "Власник"},
            {"name": "location", "description": "Розташування"},
            {"name": "useType", "description": "Вид використання"},
            {"name": "terminationDate", "description": "Дата припинення права власності"},
            {"name": "employeeID.description", "description": "Змінено"}
        ]
    }
});

