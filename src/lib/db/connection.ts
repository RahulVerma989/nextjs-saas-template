import mongoose from 'mongoose';

interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  listenersAttached: boolean;
}

const globalWithState = globalThis as typeof globalThis & {
  __mongoState?: ConnectionState;
};

if (!globalWithState.__mongoState) {
  globalWithState.__mongoState = {
    isConnected: false,
    isConnecting: false,
    listenersAttached: false,
  };
}

const state = globalWithState.__mongoState;

function buildMongoUri(): string {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  const host = process.env.MONGODB_HOST || 'localhost';
  const port = process.env.MONGODB_PORT || '27017';
  const database = process.env.MONGODB_DATABASE || 'saas_app';
  const username = process.env.MONGODB_USERNAME;
  const password = process.env.MONGODB_PASSWORD;

  const isAtlas = host.includes('.mongodb.net');

  if (username && password) {
    if (isAtlas) {
      return `mongodb+srv://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}/${database}?retryWrites=true&w=majority`;
    }
    return `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  }

  return `mongodb://${host}:${port}/${database}`;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    state.isConnected = true;
    attachListeners();
    return mongoose;
  }

  if (state.isConnected) {
    return mongoose;
  }

  if (state.isConnecting) {
    while (state.isConnecting) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (state.isConnected) {
      return mongoose;
    }
  }

  const mongoUri = buildMongoUri();
  if (!mongoUri) {
    throw new Error('MongoDB connection details are not configured');
  }

  state.isConnecting = true;

  try {
    const minPoolSize = parseInt(process.env.MONGODB_MIN_POOL_SIZE || '5', 10);
    const maxPoolSize = parseInt(process.env.MONGODB_MAX_POOL_SIZE || '50', 10);
    const connectionTimeoutMS = parseInt(process.env.MONGODB_CONNECTION_TIMEOUT_MS || '10000', 10);
    const socketTimeoutMS = parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS || '45000', 10);

    const options: mongoose.ConnectOptions = {
      minPoolSize,
      maxPoolSize,
      serverSelectionTimeoutMS: connectionTimeoutMS,
      socketTimeoutMS,
    };

    await mongoose.connect(mongoUri, options);

    state.isConnected = true;
    state.isConnecting = false;

    console.log('[MongoDB] Connected successfully');
    attachListeners();

    return mongoose;
  } catch (error) {
    state.isConnecting = false;
    state.isConnected = false;
    console.error('[MongoDB] Failed to connect:', error);
    throw error;
  }
}

function attachListeners(): void {
  if (state.listenersAttached) return;

  mongoose.connection.on('disconnected', () => {
    console.log('[MongoDB] Disconnected');
    state.isConnected = false;
  });

  mongoose.connection.on('error', (error) => {
    console.error('[MongoDB] Connection error:', error);
    state.isConnected = false;
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[MongoDB] Reconnected');
    state.isConnected = true;
  });

  state.listenersAttached = true;
}

export async function disconnectDB(): Promise<void> {
  if (!state.isConnected) return;

  try {
    await mongoose.disconnect();
    state.isConnected = false;
    console.log('[MongoDB] Disconnected gracefully');
  } catch (error) {
    console.error('[MongoDB] Error during disconnect:', error);
    throw error;
  }
}

export function getConnectionState(): ConnectionState {
  return { ...state };
}

export function isConnected(): boolean {
  return state.isConnected && mongoose.connection.readyState === 1;
}

export function getConnection(): mongoose.Connection {
  return mongoose.connection;
}
