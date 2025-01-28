module.exports = (sequelize, DataTypes) => {
   const DematAccount = sequelize.define(
      'DematAccount',
      {
         account_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
         },
         user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
            references: {
               model: 'Users',
               key: 'id',
            },
         },
         balance: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0, // Start with a balance of 0
         },
         createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
         },
         updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW, // Automatically set on updates
         },
      });

   DematAccount.afterUpdate(async (dematAccount) => {
      dematAccount.updatedAt = DataTypes.NOW;
   });

   // Add more hooks

   // DematAccount.beforeUpdate(async (dematAccount, options) => {
   //    const changedFields = Object.keys(dematAccount._changed); // Get changed fields
   //    if (changedFields.includes('user_id')) {
   //       throw new Error('Updating user_id is not allowed.');
   //    }
   // });

   return DematAccount;
};
