/**
 * mongodb 驱动
 *
 * @author : Sunkey
 */

const Sequelize = require('sequelize');

class Mysql {
    static init(mysqlConfig) {
        const client = new Sequelize(mysqlConfig);

        return client;
    }
}

module.exports = Mysql;