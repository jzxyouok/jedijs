/**
 * 数据库控制模块
 * 
 * @author : Sunkey
 */

class DB {
    static getInstance(driver, config) {
        return require('./drivers/'+driver).init(config);
    }
}

module.exports = DB;