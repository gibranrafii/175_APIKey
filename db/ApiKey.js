const { DataTypes } = require('sequelize');
const sequelize = require('./connection');

const ApiKey = sequelize.define('ApiKey', {
  name: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  key: { 
    type: DataTypes.STRING, 
    allowNull: false 
  }
});

module.exports = ApiKey;
