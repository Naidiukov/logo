const _ = require('lodash');
_.extend(UTL.shortcuts.fieldLists, {
    comm_regUnit: {
        search: [
            {"name": "ID", "visibility": false},
            {"name": "code", "description": "Код"},
            {"name": "name", "description": "Назва"},
            {"name": "type", "description": "Тип"},
            {"name": "isRegAuth", "description": "Є органом реєстрації"}
        ]
    },
    comm_report:{
        search:[
            {"name": "ID", "visibility": false},
            {"name": "repType", "description": "Тип відомості"},
            {"name": "dateFrom", "description": "Дата з"},
            {"name": "dateTo", "description": "Дата по"},
            {"name": "dateRep", "description": "Дата та час формування відомості"}
        ]
    }
});