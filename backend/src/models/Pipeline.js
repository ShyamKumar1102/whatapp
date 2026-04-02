import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Pipeline = sequelize.define('Pipeline', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 200]
    }
  },
  company: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contact_person: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING
  },
  value: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  stage: {
    type: DataTypes.ENUM('lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'),
    defaultValue: 'lead'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium'
  },
  probability: {
    type: DataTypes.INTEGER,
    defaultValue: 25,
    validate: {
      min: 0,
      max: 100
    }
  },
  expected_close_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_activity: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  assigned_to: {
    type: DataTypes.STRING,
    allowNull: true
  },
  source: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  }
}, {
  tableName: 'pipelines',
  indexes: [
    {
      fields: ['stage']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['assigned_to']
    },
    {
      fields: ['last_activity']
    }
  ]
});

const PipelineActivity = sequelize.define('PipelineActivity', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  pipeline_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'pipelines',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  user: {
    type: DataTypes.STRING,
    allowNull: false
  },
  old_value: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  new_value: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'pipeline_activities',
  indexes: [
    {
      fields: ['pipeline_id']
    },
    {
      fields: ['created_at']
    }
  ]
});

// Define associations
Pipeline.hasMany(PipelineActivity, { foreignKey: 'pipeline_id', as: 'activities' });
PipelineActivity.belongsTo(Pipeline, { foreignKey: 'pipeline_id', as: 'pipeline' });

export { Pipeline, PipelineActivity };