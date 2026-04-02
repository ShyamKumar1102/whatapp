import Contact from './Contact.js';
import { Chat, Message } from './Chat.js';
import { Pipeline, PipelineActivity } from './Pipeline.js';

// Define model associations
Contact.hasMany(Chat, { foreignKey: 'contact_id', as: 'chats' });
Chat.belongsTo(Contact, { foreignKey: 'contact_id', as: 'contact' });

export {
  Contact,
  Chat,
  Message,
  Pipeline,
  PipelineActivity
};