/**
 * 缓存控制模块
 * 
 * @author : Sunkey
 */

class Cache {
    static getInstance(driver, config) {
       return require('./drivers/'+driver).init(config); 
    }
}

module.exports = Cache;