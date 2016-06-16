/**
 * 微信助手
 *
 * @author : Sunkey
 */

const requestPromise = require('request-promise');
const crypto = require('crypto');
const wxApi = require(GLB.CONS.CONFIG_PATH + '/wxApi');

const AHEAD_EXPIRE_TIME = Symbol('AHEAD_EXPIRE_TIME');
const TICKET_JS_API = Symbol('TICKET_JS_API');
const TICKET_CARD = Symbol('TICKET_CARD');
const APP_ID = Symbol('APP_ID');
const APP_SECRET = Symbol('APP_SECRET');
const SCOPE = Symbol('SCOPE');

class WxHelper {
	/**
	 * 构造函数
	 * @param  String APP_ID     应用id
	 * @param  String APP_SECRET 应用secret
	 * @param  String SCOPE     授权范围
	 * @return null
	 */
	constructor(appId, appSecret, scope='snsapi_base') {
		// 提前过期时间
		this[AHEAD_EXPIRE_TIME] = 100;
		this[TICKET_JS_API] = 'jsapi';
		this[TICKET_CARD] = 'wx_card';
		this[APP_ID] = _.trim(appId);
		this[APP_SECRET] = _.trim(appSecret);
		this[SCOPE] = _.trim(scope);	
	}

	/**
	 * 获取jsApi签名
	 * @param  String url       页面地址
	 * @param  Number timestamp 时间戳
	 * @param  String nonceStr  随机字符串
	 * @return Promise
	 */
	*getJsApiSignature(pageUrl, timestamp, nonceStr) {
		const jsTicket = yield co(this.getGlobalJsTicket.bind(this), this[TICKET_JS_API]);
		if (!jsTicket) {
			return false;
		}

		const params = {
			'jsapi_ticket': jsTicket,
			'noncestr': nonceStr,
			'timestamp': timestamp,
			'url': pageUrl,
		};

        const srcArr = [];
		_.forEach(_.sortBy(_.keys(params)), (key) => {
			srcArr.push(key + '=' + params[key]);
		});

        const srcStr = srcArr.join('&');

		const sha1 = crypto.createHash('sha1');
		sha1.update(srcStr);

		const signature = sha1.digest('hex');

		return signature;
	}

	/**
	 * 获取全局jsTicket
	 * @param  String  ticketType ticket类型
	 * @param  Boolean replay     是否是重试
	 * @return Promise
	 */
	*getGlobalJsTicket(ticketType, replay=false) {
		const cacheKey = 'js_ticket_' + ticketType + '_' + this[APP_ID];
		let accessToken = '';
		let jsTicket = '';

		try {
			jsTicket = yield GLB.app.cache.getAsync(cacheKey);
		} catch (err) {
			GLB.app.logger.error(err);
		}

		if (!!jsTicket) {
			return jsTicket;
		}

		try {
			accessToken = yield co(this.getGlobalAccessToken.bind(this), replay);
		} catch (err) {
			GLB.app.logger.error(err);
			return false;
		}

		if (!accessToken) {
			return false;
		}

		const requestOptions = {
			url: wxApi['cgi-bin']['jsticket'],
			qs: {
				'access_token': accessToken,
				'type': ticketType,
			},
			json: true,
		};

		let resData = null;
		try {
			resData = yield requestPromise(requestOptions);
		} catch (err) {
			GLB.app.logger.error(err);
			throw err;
		}

		if (!resData) {
			return false;
		}

		if (!!resData.errcode) {
			// access_token过期
			if (resData == '40001' && !replay) {
				jsTicket = yield co(this.getGlobalJsTicket.bind(this), true);
				return jsTicket;
			} else {
				GLB.app.logger.error('js_ticket获取失败|' + JSON.stringify(resData));
				return false;
			}
		}

		jsTicket = resData.ticket;

		try {
			yield GLB.app.cache.setAsync(cacheKey, jsTicket);
			GLB.app.cache.expire(cacheKey, +resData.expires_in - this[AHEAD_EXPIRE_TIME]);
		} catch (err) {
			GLB.app.logger.error(err);
		}

		return jsTicket;
	}

	/**
	 * 获取全局accessToken
	 * @param  Boolean refresh 是否是刷新
	 * @return Promise
	 */
	*getGlobalAccessToken(refresh=false) {
		const cacheKey = 'access_token_' + this[APP_ID];
		let accessToken = '';

		if (!!refresh) {
			GLB.app.cache.expire(cacheKey, 0);
		} else {
			try {
				accessToken = yield GLB.app.cache.getAsync(cacheKey);
			} catch (err) {
			}

			if (!!accessToken) {
				return accessToken;
			}
		}

		const requestOptions = {
			uri: wxApi['cgi-bin']['access_token'],
			qs: {
				'grant_type': 'client_credential',
				'appid': this[APP_ID],
				'secret': this[APP_SECRET],
			},
			json: true,
		};

		let resData = null;
		try {
			resData = yield requestPromise(requestOptions);
		} catch (err) {
			throw err;
		}

		if (!resData || resData.errcode) {
			GLB.app.logger.error('access_token获取失败|' + JSON.stringify(resData));
			return false;
		}
		accessToken = resData.access_token;

		try {
			yield GLB.app.cache.setAsync(cacheKey, accessToken);
			GLB.app.cache.expire(cacheKey, +resData.expires_in - this[AHEAD_EXPIRE_TIME]);
		} catch (err) {
			GLB.app.logger.error(err);
		}

		return accessToken;
	}

	/**
	 * 清除缓存
	 * @return Promise
	 */
	*clearCache() {
		const jsTicketCacheKey = 'js_ticket_jsapi_' + this[APP_ID];
		const accessTokenCacheKey = 'access_token_' + this[APP_ID];

		const cacheKeys = [
			jsTicketCacheKey,
			accessTokenCacheKey,
		];

		_.forEach(cacheKeys, (cacheKey) => GLB.app.cache.expire(cacheKey, 0));

		return cacheKeys;
	}
}

module.exports = WxHelper;
