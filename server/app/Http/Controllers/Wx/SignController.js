/**
 * 微信签名控制器
 *
 * @author : Sunkey
 */

const BaseController = require(GLB.CONS.COMPONENT_PATH + '/Controllers/BaseController');
const wx = require(GLB.CONS.CONFIG_PATH + '/wx');
const WxHelper = require(GLB.CONS.HELPER_PATH + '/WxHelper');
const StringHelper = require(GLB.CONS.HELPER_PATH + '/StringHelper');

class SignController extends BaseController {
    /**
     * 获取jsApi签名接口
     * 
     * @return Json
     */
    *jsApi() {
        const pageMatch = /\?page_url=([^#]*)#?/.exec(this.request.originalUrl);
        const pageUrl = pageMatch && pageMatch.length > 1 && pageMatch[1];
        if (!pageUrl) {
            return this.response.json({code: 400, msg: '缺少page_url参数'});
        } else if (!/^http(s)?:\/\/.+/.test(pageUrl)) {
            return this.response.json({code: 400, msg: 'page_url参数非法，必须是有效的url.'});
        }

        const timestamp = _.floor(_.now()/1000);
        const nonceStr = StringHelper.random(6);
        let signature = '';
        const wxHelper = new WxHelper(wx.appId, wx.appSecret);
        try {
            signature = yield co(wxHelper.getJsApiSignature.bind(wxHelper), pageUrl, timestamp, nonceStr);
        } catch (err) {
            GLB.app.logger.error(err);
        }

        if (!signature) {
            return this.response.json({code: 500, msg: 'sign error'});
        }

        const jsApiConfig = {
            'appId': wx.appId,
            'timestamp': timestamp,
            'nonceStr': nonceStr,
            'signature': signature,
        };

        return this.response.json({code: 200, data: jsApiConfig});
    }

    /**
     * 清除redis缓存
     * @return Promise
     */
    *clearCache() {
        const wxHelper = new WxHelper(wx.appId, wx.appSecret);
        const result = yield co(wxHelper.clearCache.bind(wxHelper));

        return this.response.json({code: 200, data: result, msg: '缓存清除成功'});
    }
}

module.exports = new SignController();
