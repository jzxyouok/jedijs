/**
 * 欢迎控制器
 *
 * @author : Sunkey
 */

var BaseController = require(GLB.CONS.COMPONENT_PATH + '/Controllers/BaseController');

class IndexController extends BaseController {
    /**
     * 入口
     * 
     * @return Json
     */
    *index() {
        return this.response.json({code: 200, msg: 'Welcome Jedijs!'});
    }
}

module.exports = new IndexController();
