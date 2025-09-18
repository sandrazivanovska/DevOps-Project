const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  table_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  record_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'read']
  },
  old_values: {
    type: mongoose.Schema.Types.Mixed
  },
  new_values: {
    type: mongoose.Schema.Types.Mixed
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ip_address: {
    type: String,
    trim: true
  },
  user_agent: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for better performance
auditLogSchema.index({ table_name: 1, record_id: 1 });
auditLogSchema.index({ user_id: 1 });
auditLogSchema.index({ created_at: -1 });
auditLogSchema.index({ action: 1 });

// Static method to create audit log
auditLogSchema.statics.createLog = function(data) {
  return this.create({
    table_name: data.table_name,
    record_id: data.record_id,
    action: data.action,
    old_values: data.old_values,
    new_values: data.new_values,
    user_id: data.user_id,
    ip_address: data.ip_address,
    user_agent: data.user_agent
  });
};

module.exports = mongoose.model('AuditLog', auditLogSchema);




