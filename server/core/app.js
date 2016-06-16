/**
 * APP引导文件
 *
 * @author : Sunkey
 */

const express = require('express');
const bluebird = require('bluebird');
const fs = require('fs');
const redis = require('redis');
const log4js = require('log4js');

const logConfig = require(GLB.CONS.CONFIG_PATH + '/log');
const dbConfig = require(GLB.CONS.CONFIG_PATH + '/database');
const cacheConfig = require(GLB.CONS.CONFIG_PATH + '/cache');
const routesConfig = require(GLB.CONS.ROOT_PATH + '/app/Http/routes');
const appConfig = require(GLB.CONS.CONFIG_PATH + '/app');

const DB = require(GLB.CONS.ROOT_PATH + '/core/database/db');
const Cache = require(GLB.CONS.ROOT_PATH + '/core/cache/cache');

// 定义私有变量名
const app = Symbol('VAL.app');
const inited = Symbol('VAL.inited');

// 定义私有函数名
const initMiddleware = Symbol('FUNC.initMiddleware');
const initLog = Symbol('FUNC.initLog');
const initDatabase = Symbol('FUNC.initDatabase');
const initCache = Symbol('FUNC.initCache');
const initRoute = Symbol('FUNC.initRoute');
const init = Symbol('FUNC.init');

class App {
    constructor() {
        this[app]  = express();
        this[inited] = false;
        this.logger = null;
        this.db = null;
        this.cache = null;
    }

    /**
     * 初始化日志
     */
    [initLog]() {
        const logDir = logConfig.appenders[0].filename;
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir);
        }
        
        log4js.configure(logConfig);
        this.logger = log4js.getLogger(logConfig.appenders[0].category);
    }

    /**
     * 初始化中间件
     */
    [initMiddleware]() {
    }

    /**
     * 初始化数据库
     */
    [initDatabase]() {
        if (!dbConfig.driver) {
            return false;
        }
        const driverConfig = dbConfig['connections'][dbConfig.driver];
        this.db = DB.getInstance(dbConfig.driver, driverConfig);
    }

    /**
     * 初始化缓存
     */
    [initCache]() {
        if (!cacheConfig.driver) {
            return false;
        }

        const driverConfig = cacheConfig['connections'][cacheConfig.driver];
        this.cache = Cache.getInstance(cacheConfig.driver, driverConfig);
    }

    /**
     * 初始化路由
     */
    [initRoute]() {
        _.forEach(routesConfig, (group) => {
            _.forEach(group.list, (route) => {
                const path = group.path + route.path;
                const namespace = group.namespace;
                const method = route.method.toLowerCase();

                this[app][method](path, (req, res, next) => {
                    const routeParam = route.route.split('@');
                    const controllerName = routeParam[0];
                    const methodName = routeParam[1];
                    const controllerPath = [
                        GLB.CONS.CONTROLLER_PATH,
                        namespace,
                        controllerName,
                    ].join('/');

                    fs.exists(controllerPath + '.js', (exists) => {
                        if (!exists) {
                            return res.status(404).end('Controller not exists.');
                        } else {
                            const controller = require(controllerPath);

                            if (!_.isFunction(controller.init)) {
                                return res.end('route init error');
                            }

                            controller.init(req, res, next);

                            return jedi(function *() {
                                let beforeRt = undefined;
                                let methodRt = undefined;
                                let afterRt = undefined;

                                if (_.isFunction(controller.before)) {
                                    try {
                                        beforeRt = yield co(controller.before.bind(controller));
                                    } catch (err) {
                                        this.logger.error(err);
                                    }
                                }
                                // 如果返回的不是undefined, 则说明提前终止了请求
                                if (!_.isUndefined(beforeRt)) {
                                    return beforeRt;
                                }

                                if (_.isFunction(controller[methodName])) {
                                    try {
                                        methodRt = yield co(controller[methodName].bind(controller));
                                    } catch (err) {
                                        this.logger.error(err);
                                    }
                                }
                                // 如果返回的不是undefined, 则说明提前终止了请求
                                if (!_.isUndefined(methodRt)) {
                                    return methodRt;
                                }

                                if (_.isFunction(controller.after)) {
                                    try {
                                        afterRt = yield co(controller.after.bind(controller));
                                    } catch (err) {
                                        this.logger.error(err);
                                    }
                                }
                                // 如果返回的不是undefined, 则说明提前终止了请求
                                if (!_.isUndefined(afterRt)) {
                                    return afterRt;
                                }

                                return res.end();

                            }.bind(this)).catch((err) => {
                                this.logger.error(err);
                            });
                        }
                    });
                });
            });
        });

        this[app].get('*', function(req, res) {
            res.redirect('/welcome/index');
        });
    }

    /**
     * 初始化应用
     */
    [init]() {
        if (!!this[inited]) {
            return false;
        }

        this[initLog]();
        this[initMiddleware]();
        this[initDatabase]();
        this[initCache]();
        this[initRoute]();

        this[inited] = true;
    }

    /**
     * APP运行接口
     */
    run() {
        // 初始化
        this[init]();
        this[app].listen(appConfig.port);

        console.log('Server listen on ' + appConfig.port);
    }
}

module.exports = new App();
