/**
 * 框架安装脚本
 *
 * 安装步骤：
 * 1. 复制.env.js.example, 为 .env.js
 *
 * @author : Sunkey
 */

const fs = require('fs');

fs.exists('./.env.js', (exists) => {
	if (exists) {
		console.log('已经安装成功！');
		process.exit(1);
	}

	fs.readFile('./.env.js.example', (err, data) => {
		if (err) {
			console.log('.env.js.example 不存在，框架代码不完整，请重新下载！');
			process.exit(1);
		}

		fs.writeFile('./.env.js', data, (err, data) => {
			if (err) {
				console.log('.env.js 文件写入失败，请重试！');
				process.exit(1);
			}

			console.log('安装成功【请根据环境修改.env.js】！')
			process.exit(0);
		});
	});
});

