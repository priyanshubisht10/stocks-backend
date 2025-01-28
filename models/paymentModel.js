module.exports = (sequelize, DataTypes) => {
   const Payment = sequelize.define(
      'Payment',
      {
         payment_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
         },
         user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
               model: 'Users',
               key: 'id',
            },
         },
         demat_account_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
               model: 'DematAccounts',
               key: 'account_id',
            },
         },
         stripe_payment_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
         },
         amount: {
            type: DataTypes.FLOAT,
            allowNull: false,
         },
         //Update after every webhook event 
         status: {
            type: DataTypes.ENUM(
               'payment_intent.created',
               'payment_intent.succeeded',
               'payment_intent.paymecancelednt_failed',
               'payment_intent.processing',
               'payment_intent.requires_action',
               'payment_intent.',
               'payment_intent.amount_capturable_updated',
               'payment_intent.partially_funded',
            ),
            allowNull: false,
            defaultValue: 'payment_intent.created',
         },
         createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
         },
         updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
         },
      },
   );

   return Payment;
};
