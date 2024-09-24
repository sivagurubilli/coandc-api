import mongoose from 'mongoose';

const databaseConnection = async () => {
  await mongoose.connect(process.env.MONGO_URL);

  const db = mongoose.connection;

  db.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  db.once('open', () => {
    console.log('MongoDB connected successfully');
  });

  db.on('disconnected', () => {
    console.log('MongoDB disconnected');
  });
};

export default databaseConnection;
