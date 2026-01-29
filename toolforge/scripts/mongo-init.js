db = db.getSiblingDB('toolforge');

db.createUser({
  user: 'toolforge_app',
  pwd: 'toolforge_app_password',
  roles: [
    {
      role: 'readWrite',
      db: 'toolforge',
    },
  ],
});

db.createCollection('users');
db.createCollection('schemas');
db.createCollection('audit_logs');
db.createCollection('refresh_tokens');
