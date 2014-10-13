# s3-cnpm

S3 storage wrapper for [cnpmjs.org](htps://github.com/cnpm/cnpmjs.org)

## Installation

```bash
$ npm install s3-cnpm
```

## Usage

```js
var s3Storage = require('s3-cnpm');

var client = s3Storage({
  key: 'your access key',
  secret: 'your secret key',
  bucket: 'npm',

  // optional
  region: 'eu-west-1', // default is us-standard
  folder: 'pkgs', // default ''
  storageClass: 'STANDARD' // or REDUCED_REDUNDANCY
});
```

### License

MIT