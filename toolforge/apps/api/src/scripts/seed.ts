import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { User, ToolSchema } from '../models/index.js';
import type { ToolSchemaInput } from '@toolforge/shared';

const demoUsers = [
  { email: 'soumayadmin@gmail.com', password: 'password', name: 'Soumay Admin', role: 'admin' as const },
  { email: 'soumaymanager@gmail.com', password: 'password', name: 'Soumay Manager', role: 'manager' as const },
  { email: 'soumayagent@gmail.com', password: 'password', name: 'Soumay Agent', role: 'agent' as const },
  { email: 'soumayviewer@gmail.com', password: 'password', name: 'Soumay Viewer', role: 'viewer' as const },
];

const supportTicketsSchema: ToolSchemaInput = {
  toolId: 'support-tickets',
  name: 'Support Tickets',
  description: 'Manage customer support tickets',
  icon: 'ticket',
  resource: 'tickets',
  fields: [
    {
      key: 'title',
      label: 'Title',
      type: 'text',
      required: true,
      validation: { minLength: 3, maxLength: 200 },
      placeholder: 'Enter ticket title',
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea',
      required: true,
      validation: { minLength: 10 },
      placeholder: 'Describe the issue in detail',
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      required: true,
      default: 'medium',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      default: 'new',
      options: [
        { value: 'new', label: 'New' },
        { value: 'open', label: 'Open' },
        { value: 'pending', label: 'Pending' },
        { value: 'resolved', label: 'Resolved' },
        { value: 'closed', label: 'Closed' },
      ],
    },
    {
      key: 'assignee',
      label: 'Assignee',
      type: 'relation',
      required: false,
      relationTo: 'users',
      relationLabelField: 'name',
    },
    {
      key: 'tags',
      label: 'Tags',
      type: 'multiselect',
      required: false,
      options: [
        { value: 'bug', label: 'Bug' },
        { value: 'feature', label: 'Feature Request' },
        { value: 'question', label: 'Question' },
        { value: 'urgent', label: 'Urgent' },
        { value: 'billing', label: 'Billing' },
      ],
    },
    {
      key: 'customerEmail',
      label: 'Customer Email',
      type: 'text',
      required: true,
      validation: { pattern: '^[^@]+@[^@]+\\.[^@]+$', patternMessage: 'Invalid email format' },
    },
    {
      key: 'createdAt',
      label: 'Created At',
      type: 'datetime',
      readonly: true,
    },
    {
      key: 'updatedAt',
      label: 'Updated At',
      type: 'datetime',
      readonly: true,
    },
  ],
  listView: {
    columns: [
      { key: 'title', label: 'Title', sortable: true },
      { key: 'status', label: 'Status', sortable: true },
      { key: 'priority', label: 'Priority', sortable: true },
      { key: 'assignee', label: 'Assignee', sortable: false },
      { key: 'customerEmail', label: 'Customer', sortable: true },
      { key: 'createdAt', label: 'Created', sortable: true },
    ],
    defaultSort: { field: 'createdAt', direction: 'desc' },
    filters: [
      {
        key: 'status',
        label: 'Status',
        type: 'multiselect',
        options: [
          { value: 'new', label: 'New' },
          { value: 'open', label: 'Open' },
          { value: 'pending', label: 'Pending' },
          { value: 'resolved', label: 'Resolved' },
          { value: 'closed', label: 'Closed' },
        ],
      },
      {
        key: 'priority',
        label: 'Priority',
        type: 'select',
        options: [
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
        ],
      },
      { key: 'customerEmail', label: 'Customer Email', type: 'text' },
    ],
    pageSize: 20,
    searchableFields: ['title', 'description', 'customerEmail'],
  },
  formView: {
    sections: [
      {
        title: 'Ticket Information',
        description: 'Basic ticket details',
        fields: ['title', 'description', 'customerEmail'],
      },
      {
        title: 'Classification',
        description: 'Categorize the ticket',
        fields: ['priority', 'status', 'tags'],
      },
      {
        title: 'Assignment',
        description: 'Assign the ticket',
        fields: ['assignee'],
      },
    ],
  },
  actions: [
    {
      id: 'assign-to-me',
      label: 'Assign to Me',
      type: 'row',
      icon: 'user',
      handler: 'assignToMe',
      permissions: ['admin', 'manager', 'agent'],
    },
    {
      id: 'bulk-change-status',
      label: 'Change Status',
      type: 'bulk',
      icon: 'edit',
      handler: 'bulkChangeStatus',
      permissions: ['admin', 'manager', 'agent'],
      confirmMessage: 'Are you sure you want to change the status of selected tickets?',
    },
  ],
  permissions: {
    canAccessTool: ['admin', 'manager', 'agent', 'viewer'],
    canCreate: ['admin', 'manager', 'agent'],
    canRead: ['admin', 'manager', 'agent', 'viewer'],
    canUpdate: ['admin', 'manager', 'agent'],
    canDelete: ['admin', 'manager'],
    canViewAuditLog: ['admin', 'manager'],
  },
  audit: {
    enabled: true,
    fields: ['title', 'description', 'status', 'priority', 'assignee', 'tags'],
  },
};

const usersToolSchema: ToolSchemaInput = {
  toolId: 'users',
  name: 'Users',
  description: 'Manage system users',
  icon: 'users',
  resource: 'users',
  fields: [
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      validation: { minLength: 2 },
    },
    {
      key: 'email',
      label: 'Email',
      type: 'text',
      required: true,
      readonly: true,
    },
    {
      key: 'role',
      label: 'Role',
      type: 'select',
      required: true,
      options: [
        { value: 'admin', label: 'Admin' },
        { value: 'manager', label: 'Manager' },
        { value: 'agent', label: 'Agent' },
        { value: 'viewer', label: 'Viewer' },
      ],
    },
    {
      key: 'isActive',
      label: 'Active',
      type: 'boolean',
      default: true,
    },
    {
      key: 'createdAt',
      label: 'Created At',
      type: 'datetime',
      readonly: true,
    },
  ],
  listView: {
    columns: [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
      { key: 'role', label: 'Role', sortable: true },
      { key: 'isActive', label: 'Active', sortable: true },
      { key: 'createdAt', label: 'Created', sortable: true },
    ],
    defaultSort: { field: 'name', direction: 'asc' },
    filters: [
      {
        key: 'role',
        label: 'Role',
        type: 'select',
        options: [
          { value: 'admin', label: 'Admin' },
          { value: 'manager', label: 'Manager' },
          { value: 'agent', label: 'Agent' },
          { value: 'viewer', label: 'Viewer' },
        ],
      },
      { key: 'isActive', label: 'Active', type: 'boolean' },
    ],
    pageSize: 20,
    searchableFields: ['name', 'email'],
  },
  formView: {
    sections: [
      {
        title: 'User Information',
        fields: ['name', 'email'],
      },
      {
        title: 'Access',
        fields: ['role', 'isActive'],
      },
    ],
  },
  permissions: {
    canAccessTool: ['admin'],
    canCreate: ['admin'],
    canRead: ['admin'],
    canUpdate: ['admin'],
    canDelete: ['admin'],
    canViewAuditLog: ['admin'],
  },
  audit: {
    enabled: true,
  },
};

// Sample tickets
const sampleTickets = [
  {
    title: 'Cannot login to my account',
    description: 'I have been trying to login for the past hour but keep getting an error message saying "Invalid credentials".',
    priority: 'high',
    status: 'open',
    tags: ['bug', 'urgent'],
    customerEmail: 'john.doe@example.com',
  },
  {
    title: 'Request for new feature: Dark mode',
    description: 'It would be great if the application had a dark mode option for better viewing at night.',
    priority: 'low',
    status: 'new',
    tags: ['feature'],
    customerEmail: 'jane.smith@example.com',
  },
  {
    title: 'Billing discrepancy on invoice #12345',
    description: 'I was charged twice for my subscription this month. Please review and refund the duplicate charge.',
    priority: 'high',
    status: 'pending',
    tags: ['billing', 'urgent'],
    customerEmail: 'bob.wilson@example.com',
  },
  {
    title: 'How to export data?',
    description: 'I need to export all my data from the platform. What format options are available?',
    priority: 'medium',
    status: 'resolved',
    tags: ['question'],
    customerEmail: 'alice.johnson@example.com',
  },
  {
    title: 'Page loading very slowly',
    description: 'The dashboard page takes over 30 seconds to load. This started happening yesterday.',
    priority: 'medium',
    status: 'open',
    tags: ['bug'],
    customerEmail: 'charlie.brown@example.com',
  },
];

async function seed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodb.uri);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await ToolSchema.deleteMany({});

    // Get the tickets collection and clear it
    const ticketsCollection = mongoose.connection.collection('tickets');
    try {
      await ticketsCollection.drop();
    } catch {
      // Collection might not exist
    }

    // Create users
    console.log('Creating demo users...');
    const createdUsers: Record<string, mongoose.Types.ObjectId> = {};
    for (const userData of demoUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers[userData.role] = user._id;
      console.log(`  Created: ${userData.email} (${userData.role})`);
    }

    // Create schemas
    console.log('Creating tool schemas...');

    const ticketsSchemaDoc = new ToolSchema({
      ...supportTicketsSchema,
      isPublished: true,
      publishedAt: new Date(),
    });
    await ticketsSchemaDoc.save();
    console.log('  Created: Support Tickets schema');

    const usersSchemaDoc = new ToolSchema({
      ...usersToolSchema,
      isPublished: true,
      publishedAt: new Date(),
    });
    await usersSchemaDoc.save();
    console.log('  Created: Users schema');

    // Create sample tickets
    console.log('Creating sample tickets...');
    for (const ticket of sampleTickets) {
      await ticketsCollection.insertOne({
        ...ticket,
        assignee: ticket.status !== 'new' ? createdUsers['agent'] : null,
        createdBy: createdUsers['admin'],
        updatedBy: createdUsers['admin'],
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
        updatedAt: new Date(),
      });
    }
    console.log(`  Created ${sampleTickets.length} sample tickets`);

    console.log('\nSeed completed successfully!');
    console.log('\nDemo accounts:');
    for (const user of demoUsers) {
      console.log(`  ${user.email} / ${user.password} (${user.role})`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seed();
