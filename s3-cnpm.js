/** @license MIT License (c) copyright 2014 original authors */
/** @author Karolis Narkevicius */

var path = require('path');
var knox = require('knox');
var when = require('when');
var thunkify = require('thunkify');
var saveTo = thunkify(require('save-to'));

module.exports = function (config) {
  return new S3(config);
};

/**
 * Amazon S3 Storage Adapter for CNPM
 *
 * @param {Object} knox config
 * @api public
 */

function S3(config) {
  this.config = config;
  this.client = knox.createClient(this.config);
  this.client.getFile = thunkify(this.client.getFile);
  this.client.deleteFile = thunkify(this.client.deleteFile);
}

/**
 * Upload a package from filepath to S3.
 *
 * @param {String} filepath the path of the file to upload
 * @param {Object} options with key and size
 * @return {Object} an object with the key
 * @api public
 */

S3.prototype.upload = function* (filepath, options) {
  var s3Config = this.config;
  var client = this.client;
  var dest = this.getPath(options.key);

  var uploadOptions = {};

  if (s3Config.storageClass) {
    uploadOptions['x-amz-storage-class'] = s3Config.storageClass;
  }

  yield when.promise(function (resolve, reject) {
    client.putFile(filepath, dest, uploadOptions, function (err, res) {
      if (err) return reject(err);
      if (res.statusCode !== 200) { return reject(new Error('putFile failed with ' + res.statusCode)); }
      resolve();
    }).on('error', function (err) {
      reject(new Error('Network error' + err.message));
    });
  });

  return { key: options.key };
};

/**
 * Upload a package from filepath to S3.
 *
 * @param {String} contents of the file to upload
 * @param {Object} options with key and size
 * @return {Object} an object with the key
 * @api public
 */

S3.prototype.uploadBuffer = function* (content, options) {
  var client = this.client;
  var filepath = this.getPath(options.key);

  var headers = {
    'Content-Type': 'application/x-gzip'
  };
  yield when.promise(function (resolve, reject) {
    client.putBuffer(content, filepath, headers, function(err, res) {
      if (err) return reject(err);
      if (res.statusCode !== 200) return reject(new Error('putBuffer failed with ' + res.statusCode));
      resolve();
    }).on('error', function (err) {
      reject(new Error('Network error' + err.message));
    });
  });

  return { key: options.key };
};

/**
 * Download a package from S3.
 *
 * @param {String} package key
 * @param {String} download path
 * @param {options} an object with timeout
 * @api public
 */

S3.prototype.download = function* (key, savePath) {
  var client = this.client;
  var filepath = this.getPath(key);
  var res = yield client.getFile(filepath);
  yield saveTo(res, savePath);
};

/**
 * Remove a package from S3
 *
 * @param {String} package key
 * @api public
 */

S3.prototype.remove = function* (key) {
  var client = this.client;
  var filepath = this.getPath(key);
  yield client.deleteFile(filepath);
};

/**
 * escape '/' and '\'
 * prepend the config.folder
 */

S3.prototype.getPath = function (key) {
  key = key.replace(/\//g, '-').replace(/\\/g, '_');
  key = path.join(this.config.folder, key);
  return key;
};
