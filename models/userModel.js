const bcrypt = require('bcrypt');

//userModel.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'user'),
      allowNull: false,
      default: 'user',
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isNumeric: true,
        len: [10, 15],
      },
    },
    addressLine1: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    addressLine2: {
      type: DataTypes.STRING,
    },
    streetName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    zip: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pan_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [10, 10],
      },
    },
    pan_verification_status: {
      type: DataTypes.ENUM('pending', 'verified', 'rejected'),
      defaultValue: 'pending',
    },
    hashedAdhar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    wishlist: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isValidWishlist(value) {
          if (value) {
            const items = value.split(',');
            if (items.length > 10) {
              throw new Error(
                'Wishlist can contain up to 10 stock symbols only.'
              );
            }
          }
        },
      },
    },
    // account_balance: {
    //   type: DataTypes.FLOAT,
    //   defaultValue: 0.0,
    // },
    total_portfolio_value: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
    },
    account_status: {
      type: DataTypes.ENUM('active', 'suspended', 'deactivated'),
      defaultValue: 'active',
    },
  });

  // Hash password before creating or updating user
  User.beforeCreate(async (user) => {
    if (user.password) {
      user.password = await bcrypt.hash(user.password, 10);
    }
  });

  User.beforeUpdate(async (user) => {
    if (user.changed('password')) {
      user.password = await bcrypt.hash(user.password, 10);
    }
  });

  return User;
};
