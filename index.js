/*
 * createTable input format
{
		"tableName": {table_name}, //required
		"character": {
				"set": {charset}, //binary | utf8(default) ...
				"collate": {collate} //utf8_ganeral_ci(default) | latin1_general_cs ...
		},
		"engine": {your table engine} //InnoDB(default) | MyISAM | Memory | CSV | Archive | Blackhole | Merge | Federated | Example https://dev.mysql.com/doc/refman/5.7/en/storage-engines.html
		"comment": {your table comment},
		"reference": [
				{
						"tableName": {reference_table_name},
						"columns": [{reference_column_name1}, {reference_column_name2}...],
						"keyColumns": [{key_column_name1}, {key_column_name2}...],
						"options": [
								{
										"actionName": {action name}, //DELETE | UPDATE
										"optionValue": {option value}//RESTRICT | CASCADE | SET NULL | NO ACTION | SET DEFAULT
								}
						]
				}
		],
		"columnData": [
				{
						"name": {column name}, //required
						"type": { //string | object
								"name": {type}, //INT(default), INTEGER, BIGINT, VARCHAR, DATE, TIMESTAMP...
								"size": {type size} (default size is 11)
						},
						"character": {
								"set": {charset}, //binary | utf8(default) ...
								"collate": {collate} //utf8_ganeral_ci(default) | latin1_general_cs ...
						},
						"primaryKey": {primary key flag}, //0(default) | 1
						"default": {default value}, 
						"null": {default null flag}, //0(default) | 1
						"ai": {auto increment flag}, //0(default) | 1
						"index": {column index flag}, //0(default) | 1
						"comment": {your column comment}
				}
		]
}
*/
var createTable = function (tableConfig) {
	var tableName = tableConfig['tableName'],
		columnDefinition = [],
		tableCharacter = '',
		tableComment = '',
		primaryKey = [],
		referenceList = [],
		indexColumns = [];

	//table comment
	if (tableConfig['comment'] !== undefined) {
		tableComment = ` COMMENT = "${tableConfig['comment']}"`;
	}

	//table character
	if (tableConfig['character'] !== undefined) {
		tableCharacter = ` CHARACTER SET ${tableConfig['character']['set'] || 'utf8'}`;
		if (tableConfig['character']['set'].toUpperCase() !== 'BINARY') {
			tableCharacter += ` COLLATE ${tableConfig['character']['collate'] || 'utf8_general_ci'}`;
		}
	}

	//table engien
	var engien  = ` ENGINE = ${tableConfig['engien'] || 'innoDB'}`;

	//columnData의 property를 사용하여 rds의 필드를 설정 합니다.
	for (var i = 0; i < tableConfig['columnData'].length; i++) {
		var columnData = tableConfig['columnData'][i],
			columnName = columnData['name'], 
			columnType = columnData['type'],
			columnCharacter = '',
			columnComment = '';

		//칼럼 데이터 타입 설정
		if (Object.prototype.toString.call(columnData['type']) === '[object Object]') {
			var columnTypeName = (columnType['name'] || 'INT').toUpperCase(),
				columnTypeSize = '';
			if (columnType['size'] !== undefined) {
				columnTypeSize = `(${columnType['size'] || 11})`;
			}
			columnType = `${columnTypeName}${columnTypeSize}`;
		} else if (Object.prototype.toString.call(columnData['type']) === '[object String]') {
			columnType = columnType.toUpperCase();
		} else {
			columnType = 'INT';
		}

		//columns character
		if (columnData['character'] !== undefined) {
			var columnCharacterSet = columnData['character']['set'] || 'utf8';
			columnCharacter = ` CHARACTER SET ${columnCharacterSet}`;
			if (columnCharacterSet.toUpperCase() !== 'BINARY') {
				columnCharacter += ` COLLATE ${columnData['character']['collate'] || 'utf8_general_ci'}`;
			}
		}

		//primary key check
		if (columnData['primaryKey'] === 1) {
			primaryKey.push(columnName);
			if (Array.isArray(tableConfig['primaryKey'])) {
				tableConfig['primaryKey'] = tableConfig['primaryKey'].join('`, `');
			}
		}

		//columns comment
		if (columnData['comment'] !== undefined) {
			columnComment = ` COMMENT "${columnData['comment']}"`;
		}

		//default 값 사용 여부
		if (columnData['default'] !== undefined) {
			//숫자가 아닐 경우 따옴표로 감싸기
			if (isNaN(columnData['default']) === true) {
				columnData['default'] = `"${columnData['default']}"`;
			}
			var columnDefaultValue = `DEFAULT ${columnData['default']}`;
		}

		//null 사용 여부 
		var columnNullFlag = columnData['null'] === 1 ? ' DEFAULT NULL' : (columnData['null'] === '' ? '' : ' NOT NULL ');

		//auto increment setting
		var columnAIFlag = columnData['ai'] === 1 ? ' AUTO_INCREMENT ' : '';

		//make create query and insert query list
		columnDefinition.push(['`' + columnName + '`', columnType, columnCharacter, columnDefaultValue, columnNullFlag, columnAIFlag, columnComment].join(' '));

		//칼럼 인덱스 설정
		if (columnData['index'] === 1) {
			indexColumns.push(' KEY `index_' + columnName + '` (`' + columnName + '`)');
		}
	}

	//외래키 설정, 참조 설정
	if (tableConfig['reference'] !== undefined) {
		var referenceConfig = tableConfig['reference'],
			referenceActionList = [];
		for (var i = 0; i < referenceConfig.length; i++) {
			var reference = referenceConfig[i],
				keyColumns = reference['keyColumns'],
				referenceTableName = reference['tableName'],
				referenceColumns = reference['columns'],
				referenceDefinition;
			referenceDefinition = 'FOREIGN KEY (`' + keyColumns.join('`, `') + '`) REFERENCES `' + referenceTableName + '`(`' + referenceColumns.join('`, `') + '`)';
			if (reference['options'] !== undefined) {
				var referenceOptions = reference['options'];
				for (var o = 0; o < referenceOptions.length; o++) {
					var actionName = referenceOptions[o]['actionName'].toUpperCase(),
						optionValue = referenceOptions[o]['optionValue'].toUpperCase();
					referenceDefinition += ` ON  ${actionName} ${optionValue}`;
				}
			}
			referenceList.push(referenceDefinition);
		}
	}

	if (primaryKey.length > 0) {
		primaryKey = [' PRIMARY KEY (`' + primaryKey.join('`, `') + '`)'];
		columnDefinition = columnDefinition.concat(primaryKey);
	}
	columnDefinition = columnDefinition.concat(indexColumns);
	if (referenceList.length > 0) {
		columnDefinition = columnDefinition.concat(referenceList);
	}
	var createTableQuery =  'CREATE TABLE IF NOT EXISTS `' + tableName + '` ';
	createTableQuery = `${createTableQuery} (${columnDefinition.join(', ')}) ${engien} ${tableCharacter} ${tableComment}`;
	return createTableQuery.replace(/[\s]{2,}/g, ' ');
}

var createInsertQuery = function (tableName, param, updateParam) {
	var sql = '',
	keys = Object.keys(param),
	values = [];
	for (var key in param) {
		if (param.hasOwnProperty(key)) {
			values.push(`"${param[key]}"`);
		}
	}
	values = values.join(', ');
	keys = keys.map(function (keys) {
		return `\`${keys}\``;
	}).join(', ');
	sql = `INSERT INTO \`${tableName}\` (${keys}) VALUES(${values})`;
	if (updateParam !== undefined) {
		var updatesql = [];
		sql += ` ON DUPLICATE KEY UPDATE `;
		for (var column in updateParam) {
			updatesql.push(`\`${column}\`=${updateParam[column]}`);
		}
		sql += updatesql.join(', ');
	}
	return sql;
} 

var makeWhereStr = function (params, operator) {
	var whereStr = [];
	if (params !== undefined && Object.prototype.toString.call(params) === '[object Object]') {
		for (var column in params) {
			var sqlOp = params[column]['operator'];
			switch (sqlOp.toUpperCase()) {
				case 'EQUAL' :
					whereStr.push(`\`${column}\`=\"${params[column]['value']}\"`);
					break;
				case 'LIKE' :
					whereStr.push(`\`${column}\` LIKE \"%${params[column]['value']}%\"`);
					break;
				case 'IN' :
					var value = params[column]['value'];
					if (Object.prototype.toString.call(value) === '[object Array]') {
						value = `"${value.join('", "', value)}"` ;
					}
					whereStr.push(`\`${column}\` IN \"${value}\"`);
					break;
				default :
					whereStr.push(`\`${column}\`=\"${params[column]['value']}\"`);
					break;
			}
		}
	}
	if (whereStr.length > 0) {
		whereStr = whereStr.join(` ${operator || '&&'} `);
	} else {
		whereStr = '1';
	}
	return whereStr;
}

var formatQuery = function (query) {
	if (Object.prototype.toString.call(query) === '[object Array]') {
		query = query.join(';');
	}
	return query;
}

module.exports = {
	createTable: createTable,
	createInsertQuery: createInsertQuery,
	makeWhereStr: makeWhereStr
};
