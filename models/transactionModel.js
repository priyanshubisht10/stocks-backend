module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    transaction_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    buy_order_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Orders',
        key: 'order_id',
      },
    },
    sell_order_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Orders',
        key: 'order_id',
      },
    },
    buy_user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    sell_user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    total_value: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false, // Calculated as quantity * price
    },
    status: {
      type: DataTypes.ENUM('processing', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'processing', // Initial status set to processing
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // Define relationships
  Transaction.associate = function (models) {
    Transaction.belongsTo(models.Order, {
      foreignKey: 'buy_order_id',
      as: 'BuyOrder',
    });
    Transaction.belongsTo(models.Order, {
      foreignKey: 'sell_order_id',
      as: 'SellOrder',
    });
    Transaction.belongsTo(models.User, {
      foreignKey: 'buy_user_id',
      as: 'BuyUser',
    });
    Transaction.belongsTo(models.User, {
      foreignKey: 'sell_user_id',
      as: 'SellUser',
    });
  };

  return Transaction;
};
