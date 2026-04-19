'use strict';

let ioInstance = null;

function setIO(io) {
  ioInstance = io;
}

function getIO() {
  return ioInstance;
}

function getAdminNamespace() {
  if (!ioInstance) return null;
  return ioInstance.of('/admin');
}

module.exports = {
  setIO,
  getIO,
  getAdminNamespace,
};

