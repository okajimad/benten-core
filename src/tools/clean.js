const fsex = require('fs-extra');

fsex.removeSync('src/generated');
fsex.removeSync('contracts');
fsex.removeSync('build');
