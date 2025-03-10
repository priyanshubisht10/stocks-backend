module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    order_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    stock_symbol: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true, // Can be null for market orders
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    order_type: {
      type: DataTypes.ENUM('buy', 'sell'),
      allowNull: false,
    },
    order_mode: {
      type: DataTypes.ENUM('market', 'limit'),
      allowNull: false,
    },
    total_value: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true, // Calculated later for market orders
    },
    status: {
      type: DataTypes.ENUM(
        'pending',
        'partially_filled',
        'completed',
        'cancelled'
      ),
      allowNull: false,
      defaultValue: 'pending',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    matched_order_id: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: true,
    },
    fees: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    filled_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    remaining_quantity: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.quantity - this.filled_quantity;
      },
    },
    execution_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  return Order;
};
