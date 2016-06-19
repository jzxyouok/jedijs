/**
 * 基础控制器组件
 *
 * @author : Sunkey
 */

const corsConfig = require(GLB.CONS.CONFIG_PATH + '/cors');

class BaseController {
    constructor() {
        this.request = null;
        this.response = null;
        this.next = null;
    }

    init(req, res, next) {
        this.request = req;
        this.response = res;
        this.next = next;

        this.response.set('Content-Type', 'application/json;charset=utf8');
        this.response.set('Access-Control-Allow-Origin', corsConfig.allow.join(','));
    }
}

module.exports = BaseController;
