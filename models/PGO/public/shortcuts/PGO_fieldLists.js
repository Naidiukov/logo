_.extend(UTL.shortcuts.fieldLists, {
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
    pgo_localRequisites:{
        search:[
            {"name": "ID", "visibility": false},
            {"name": "pgoDictID", "description": "Назва"},
            {"name": "settlementDictID.governmentShortName", "description": "Адміністративний центр ради"},
            {"name": "streetID", "description": "Вулиця"},
            {"name": "houseNum", "description": "Номер будинку"},
            {"name": "headFullName", "description": "ПІБ (голова)"},
            {"name": "clerkFullName", "description": "ПІБ (секретар)"},
            {"name": "totalArea", "description": "Загальна площа (Га)"},
            {"name": "settlementTotalArea", "description": "Загальна площа населених пунктів (Га)"}
        ]
    },
    pgo_cognation:{
        search:[
            {"name": "ID", "visibility": false},
            {"name": "name", "description": "Назва"}
        ]
    },
    pgo_objAccounting:{
        search:[
            {"name": "ID", "visibility": false},
            {"name": "pgoBook", "description": "Книга ПГО", "format":"0"},
            {"name": "pgoBookPage", "description": "Сторінка книги ПГО", "format":"0"},
            {"name": "objState", "description": "Стан об’єкта"},
            {"name": "headPayerID", "description": "Голова домогосподарства"},
            {"name": "pgoObjNum", "description": "Номер об’єкта ПГО"},
            {"name": "pgoType", "description": "Тип об’єкта ПГО"},
            {"name": "locationID", "description": "Місцезнаходження"},
            {"name": "streetStr", "description": "Адреса"},
            {"name": "houseNum", "description": "Номер будинку"},
            {"name": "flatNum", "description": "Номер квартири"},
            {"name": "householdMembers", "description": "Члени домогосподарства"},
            {"name": "isMarked", "description": "Позначена", "visibility": false},
            {"name": "oldID", "description": "oldID", "visibility": false}
        ]
    },
    pgo_report:{
        search:[
            {"name": "ID", "visibility": false},
            {"name": "locationID", "description": "Місцезнаходження"},
            {"name": "year", "description": "Рік"},
            {"name": "repType", "description": "Тип звіту"},
            {"name": "dateRep", "description": "Дата звіту"}
        ]
    },
    pgo_yearsDic:{
        search:[
            {"name": "ID", "visibility": false},
            {"name": "yearsPeriod", "description": "Період"}
        ]
    },
    pgo_areaDict:{
        search:[
            {"name": "ID", "visibility": false},
            {"name": "areaName", "description": "Назва області"}
        ]
    },
    pgo_exemptionPhysDict:{
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
    pgo_objLog:{
        search:[
            {"name": "ID", "visibility": false},
            {"name": "changeDate", "description": "Дата зміни"},
            {"name": "actionType", "description": "Тип операції"},
            {"name": "entityName", "description": "Сутність"},
            {"name": "streetID", "description": "Адреса"},
            {"name": "houseNum", "description": "Номер будинку"},
            {"name": "flatNum", "description": "Номер квартири"},
            {"name": "personType", "description": "Тип особи"},
            {"name": "payerID", "description": "ПІБ"},
            {"name": "roomType", "description": "Тип приміщення"},
            {"name": "totalArea", "description": "Загальна площа (м2)"},
            {"name": "cadastralNumber", "description": "Кадастровий номер"},
            {"name": "landCategory", "description": "Категорія земель"},
            {"name": "location", "description": "Розташування"},
            {"name": "useType", "description": "Вид використання"},
            {"name": "landPurpose", "description": "Угіддя"},
            {"name": "documentOwnership", "description": "Документ права власності"},
            {"name": "registryData", "description": "Дата держреєстрації"},
            {"name": "position", "description": "Місцезнаходження"},
            {"name": "employeeID.description", "description": "Змінено"}
        ]
    }
});

