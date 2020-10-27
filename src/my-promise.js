/**
 * Promise A+规范
 * https://juejin.im/post/6844903767654023182
 * 参考资料
 * 1. https://mp.weixin.qq.com/s/qdJ0Xd8zTgtetFdlJL3P1g
 * 2. https://juejin.im/post/6844903918686715917?utm_source=gold_browser_extension#heading-12
 */

const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

function Promise(executor) {
  // promise的返回值
  this.result = null;
  // promise的当前状态
  this.status = PENDING;
  // fulfilled回调
  this.fulfilledCallbacks = [];
  // rejected回调
  this.rejectedCallbacks = [];
  resolve = (val) => {
    setTimeout(() => {
      // 2.1.1 只有在pending状态下才可能转换成fulfilled/rejected状态
      if (this.status === PENDING) {
        this.status = FULFILLED;
        this.result = val;
        this.fulfilledCallbacks.forEach(callback => callback(val));
      }
    });
  }
  reject = (reason) => {
    setTimeout(() => {
      // 2.1.1 只有在pending状态下才可能转换成fulfilled/rejected状态
      if (this.status === PENDING) {
        this.status = REJECTED;
        this.reason = reason;
        this.rejectedCallbacks.forEach(callback => callback(reason));
      }
    });
  }
  try {
    executor(resolve, reject);
  } catch (e) {
    reject(e);
  }
}

/**
 * 
 * @param {Promise} promise 当前promise
 * @param {Promise} x 上一个promise的返回值
 * @param {*} resolve resolve方法
 * @param {*} reject reject方法
 */
function resolvePromise(promise, x, resolve, reject) {
  // 如果上一个promise返回了自己, 循环引用
  if (promise === x) {
    return reject(new TypeError('circular reference'));
  }
  let called = false;
  if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
    try {
      let then = x.then;
      if (typeof then === 'function') {
        then.call(x, function(y) {
          if (called) {
            return;
          }
          called = true;
          resolvePromise(promise, y, resolve, reject);
        }, function(e) {
          if (called) {
            return;
          }
          called = true
          reject(e);
        })
      } else {
        // 不是thenable的对象,直接透传
        resolve(x)
      }
    } catch (e) {
      if (called) {
        return;
      }
      called = true;
      reject(e)
    }
  } else {
    resolve(x);
  }
}


// 2.2 then方法, 接受onFulfilled和onRejected两个参数
Promise.prototype.then = function(onFulfilled, onRejected) {
  /**
   * 2.2.1 onFulfilled 和 onRejected 都是可选参数：(给了默认值)
   * 2.2.1.1 如果 onFulfilled 不是函数，它会被忽略
   * 2.2.1.2 如果 onRejected 不是函数，它会被忽略
   */
  typeof onFulfilled !== 'function' && (onFulfilled = value => value);
  typeof onRejected !== 'function' && (onRejected = reason => { throw reason });
  let promise
  switch (this.status) {
    case PENDING: {
      promise = new Promise((resolve, reject) => {
        this.fulfilledCallbacks.push(() => {
          try {
            let x = onFulfilled(this.result);
            resolvePromise(promise, x, resolve, reject);
          } catch (e) {
            reject(e)
          }
        });
        this.rejectedCallbacks.push(() => {
          try {
            let x = onRejected(this.reason);
            resolvePromise(promise, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      });
    };break;
    case FULFILLED: {
      promise = new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            const x = onFulfilled(this.result);
            resolvePromise(promise, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      });
    };break;
    case REJECTED: {
      promise = new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            const x = onRejected(this.reason);
            resolvePromise(promise, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      });
    };break;
    default:
  }
  return promise;
}

Promise.prototype.catch = function(callback) {
  return this.then(null, callback);
}

Promise.prototype.finally = function(callback) {
  return this.then(
    res => Promise.resolve(callback()).then(() => res),
    err => Promise.resolve(callback()).then(() => { throw err; })
  )
}

// promises-aplus-tests 测试用方法
Promise.deferred = Promise.defer = function() {
  let dfd = {};
  dfd.promise = new Promise((resolve, reject) => {
      dfd.resolve = resolve;
      dfd.reject = reject;
  });
  return dfd;
}

try {
  module.exports = Promise;
} catch (e) {}
