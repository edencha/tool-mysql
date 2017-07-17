# Tool mysql

coolsms actionlog 수집 람다 함수입니다.
Mysql용 쿼리 빌더입니다. npm으로 배포 되고 있습니다.

## Feature
* Create mysql table query

## Install
```text
npm install tool-mysql
```

## Quick start
```javascript
const toolMysql = require('./tool-mysql');
const tableConfig = {
	tableName: "product_order",
	reference: [
		{
			tableName: "product",
			keyColumns: ["product_category", "product_id"],
			columns: ["category", "id"],
			options: [
				{
					actionName: "update",
					optionValue: "cascade"
				},
				{
					actionName: "delete",
					optionValue: "restrict"
				}
			]
		},
		{
			tableName: "customer",
			keyColumns: ["customer_id"],
			columns: ["id"]
		}
	],
	columnData: [
		{
			name: "no",
			ai: 1,
			primaryKey: 1
		},
		{
			name: "product_category",
		},
		{
			name: "product_id",
			index: 1,
		},
		{
			name: "customer_id",
			index: 1,
		}
	]
}
let query = toolMysql.createTable(tableConfig);
```

## Return Values
```sql
CREATE TABLE IF NOT EXISTS `product_order` (
	`no` INT NOT NULL AUTO_INCREMENT , 
	`product_category` INT NOT NULL , 
	`product_id` INT NOT NULL , 
	`customer_id` INT NOT NULL , 
	PRIMARY KEY (`no`), 
	KEY `index_product_id` (`product_id`), 
	KEY `index_customer_id` (`customer_id`), 
	FOREIGN KEY (`product_category`, `product_id`) 
		REFERENCES `product`(`category`, `id`) 
		ON UPDATE CASCADE ON DELETE RESTRICT, 
	FOREIGN KEY (`customer_id`) 
		REFERENCES `customer`(`id`)
) ENGINE = innoDB
```

## Input table config
```javascript
{
	"tableName": {table_name}, //required
	"character": {
		"set": {table default charset}, //binary | utf8(default) ...
		"collate": {table collate} //utf8_ganeral_ci(default) | latin1_general_cs ...
	},
	//https://dev.mysql.com/doc/refman/5.7/en/storage-engines.html
	"engine": {your table engine} //InnoDB(default) | MyISAM | Memory | CSV | Archive | Blackhole | Merge | Federated | Example 
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
				"size": {type size} //(default size is 11)
			},
			"character": {
				"set": {column charset}, //binary | utf8(default) ...
				"collate": {column collate} //utf8_ganeral_ci(default) | latin1_general_cs ...
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
```
