import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Chat = sequelize.define('Chat', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  contact_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'contacts',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'resolved', 'pending'),
    defaultValue: 'active'
  },
  assigned_agent: {
    type: DataTypes.STRING,
    allowNull: true
  },
  last_message: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  last_message_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  unread_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'chats',
  indexes: [
    {
      fields: ['contact_id']
    },
    {
      fields: ['last_message_time']
    },
    {
      fields: ['status']
    }
  ]
});

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  chat_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'chats',
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('text', 'image', 'document', 'audio', 'video'),
    defaultValue: 'text'
  },
  sender: {
    type: DataTypes.ENUM('contact', 'agent'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('sent', 'delivered', 'read'),
    defaultValue: 'sent'
  },
  media_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  file_name: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'messages',
  indexes: [
    {
      fields: ['chat_id']
    },
    {
      fields: ['created_at']
    }
  ]
});

// Define associations
Chat.hasMany(Message, { foreignKey: 'chat_id', as: 'messages' });
Message.belongsTo(Chat, { foreignKey: 'chat_id', as: 'chat' });

export { Chat, Message };