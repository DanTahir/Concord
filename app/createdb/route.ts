import bcrypt from 'bcrypt';
//import { db } from '@vercel/postgres';

//const client = await db.connect();

import { query, connectToDatabase } from '../lib/db';


async function seedUserGroups() {
  await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

  await query(`DROP TABLE IF EXISTS usergroups`);
  await query(`
    CREATE TABLE IF NOT EXISTS usergroups (
      userGroupId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      userGroupName VARCHAR(32) NOT NULL,
      joinPublicServers BOOLEAN NOT NULL DEFAULT false,
      joinPrivateServers BOOLEAN NOT NULL DEFAULT false,
      createPublicServers BOOLEAN NOT NULL DEFAULT false,
      createPrivateServers BOOLEAN NOT NULL DEFAULT false,
      addFriends BOOLEAN NOT NULL DEFAULT false,
      sendMessages BOOLEAN NOT NULL DEFAULT false,
      useVoice BOOLEAN NOT NULL DEFAULT false,
      useAdmin BOOLEAN NOT NULL DEFAULT false,
      defaultGroup BOOLEAN NOT NULL DEFAULT false
    )
  `);

  await query(`
    INSERT INTO usergroups (userGroupName, joinPublicServers, joinPrivateServers, createPublicServers, createPrivateServers, addFriends, sendMessages, useVoice, useAdmin, defaultGroup)
    VALUES ('owner', true, true, true, true, true, true, true, true, false), ('admin', true, true, true, true, true, true, true, true, false), ('user', true, true, true, true, true, true, true, false, true), ('banned', false, false, false, false, false, false, false, false, false) 
  `);


}

async function seedUsers() {
  await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  await query(`DROP TABLE IF EXISTS users`);
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      userId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      userName VARCHAR(32) NOT NULL,
      displayName VARCHAR(32) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      hashedPassword TEXT NOT NULL,
      userGroupId UUID NOT NULL
    )
  `);
  const hashedPassword = await bcrypt.hash('123456', 13);
  await query(`
    INSERT INTO users (displayname, username, email, hashedpassword, usergroupid)
    VALUES (
      'owner', 
      'owner', 
      'owner@email.com', 
      $1, 
      (SELECT userGroupId FROM usergroups WHERE userGroupName = 'owner')
    )
  `, [hashedPassword]);

}

async function seedServers(){
  await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  await query(`DROP TABLE IF EXISTS servers`);
  await query(`
    CREATE TABLE IF NOT EXISTS servers (
      serverId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      serverName VARCHAR(32) NOT NULL,
      serverDesc TEXT NOT NULL UNIQUE,
      isPublic BOOLEAN NOT NULL DEFAULT false,
      ownerId UUID NOT NULL
    )
  `);
  await query(`
    INSERT INTO servers (serverName, serverDesc, isPublic, ownerId)
    VALUES (
      E'owner\\'s server', 
      'The default server that belongs to the owner', 
      true,
      (SELECT userId FROM users WHERE userName = 'owner')
    )
  `);

}

async function seedCategories(){
  await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  await query(`DROP TABLE IF EXISTS categories`);
  await query(`
    CREATE TABLE IF NOT EXISTS categories (
      categoryID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      categoryName VARCHAR(32) NOT NULL,
      categoryDesc TEXT NOT NULL UNIQUE,
      isPublic BOOLEAN NOT NULL DEFAULT true,
      serverId UUID NOT NULL,
      categorySort INTEGER NOT NULL
    )
  `);
  await query(`
    INSERT INTO categories (categoryName, categoryDesc, isPublic, serverId, categorySort)
    VALUES (
      'text', 
      'text channels', 
      true,
      (SELECT serverId FROM servers WHERE serverName = E'owner\\'s server'),
      1
    )
  `);

}

export async function GET() {
  try {
    
    await query(`BEGIN`);
    await seedUserGroups();
    await seedUsers();
    await seedServers();
    await query(`COMMIT`);


    return Response.json({ message: 'Database created successfully' });
  } catch (error) {
    await query(`ROLLBACK`);
    return Response.json({ error }, { status: 500 });
  }
}