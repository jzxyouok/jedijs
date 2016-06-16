/**
 * 路由配置文件
 *
 * @author : Sunkey
 */

module.exports = [
    {
        comment: '欢迎路由组',
        namespace: 'Welcome',
        path: '/welcome',
        list: [
            {
                comment: '入口',
                method: 'GET',
                path: '/index',
                route: 'IndexController@index',
            }
        ],
    },
    {
        comment: '微信路由组',
        namespace: 'Wx',
        path: '/wx',
        list: [
            {
                comment: 'jsApi 签名',
                method: 'GET',
                path: '/sign/js_api',
                route: 'SignController@jsApi',
            },
            {
                comment: '清除签名缓存',
                method: 'GET',
                path: '/sign/clear_cache',
                route: 'SignController@clearCache',
            },
        ],
    },
];
