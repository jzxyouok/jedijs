/**
 * redis 驱动
 *
 * @author : Sunkey
 */

const redis = require('redis');
const bluebird = require('bluebird');

class Redis {
    static init(redisConfig) {
        redisConfig = _.pickBy(redisConfig, (val) => {return val;});

        bluebird.promisifyAll(redis.RedisClient.prototype);
        bluebird.promisifyAll(redis.Multi.prototype);

        const client = redis.createClient(redisConfig);

        client.on('error', (err) => {
            GLB.app.logger.error(err);
        });

        client.on('ready', (err) => {
            GLB.app.logger.info('redis is ready.');
        });

        return client;
    }
}

module.exports = Redis;
