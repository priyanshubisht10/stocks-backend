module.exports = (sequelize, DataTypes) => {
   const Stock = sequelize.define(
      'Stock',
      {
         stock_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
         },
         stock_symbol: {
            type: DataTypes.STRING, 
            allowNull: false,
            unique: true,
         },
         company_name: {
            type: DataTypes.STRING, 
            allowNull: false,
         },
         company_description: {
            type: DataTypes.STRING, 
            allowNull: false,
         },
         current_price: {
            type: DataTypes.DECIMAL(15, 2), 
            allowNull: false,
         },
         day_high: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0.00,
         },
         day_low: {
            type: DataTypes.DECIMAL(15, 2), 
            allowNull: false,
            defaultValue: 0.00,
         },
         opening_price: {
            type: DataTypes.DECIMAL(15, 2), 
            allowNull: false,
         },
         closing_price: {
            type: DataTypes.DECIMAL(15, 2), 
            allowNull: false,
         },
         market_cap: {
            type: DataTypes.BIGINT,
            allowNull: true,
         },
         volume: {
            type: DataTypes.BIGINT, 
            allowNull: false,
            defaultValue: 0,
         },
         sector: {
            type: DataTypes.STRING, 
            allowNull: true,
         },
         stock_img_url: {
            type: DataTypes.STRING, 
            allowNull:true
         },
         exchange: {
            type: DataTypes.STRING, 
            allowNull: false,
         },
         updated_at: {
            type: DataTypes.DATE, 
            allowNull: false,
            defaultValue: DataTypes.NOW,
         },
      });

   return Stock;
};
