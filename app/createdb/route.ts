import bcrypt from 'bcrypt';
//import { db } from '@vercel/postgres';

//const client = await db.connect();

import { query, queryTyped } from '../lib/db';
import type { User } from '../lib/definitions';


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
    INSERT INTO usergroups (
      userGroupName, 
      joinPublicServers, 
      joinPrivateServers, 
      createPublicServers, 
      createPrivateServers, 
      addFriends, 
      sendMessages, 
      useVoice, 
      useAdmin, 
      defaultGroup
    )
    VALUES ('owner', true, true, true, true, true, true, true, true, false), ('admin', true, true, true, true, true, true, true, true, false), ('user', true, true, true, true, true, true, true, false, true), ('banned', false, false, false, false, false, false, false, false, false) 
  `);


}

async function seedUsers() {
  await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  await query(`DROP TABLE IF EXISTS users`);
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      userId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      userName VARCHAR(32) NOT NULL,
      displayName VARCHAR(32) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      hashedPassword TEXT NOT NULL,
      userGroupId UUID NOT NULL
    )
  `);
  const hashedPassword = await bcrypt.hash('123456', 13);
  await query(`
    INSERT INTO users (
      displayname, 
      username, 
      email, 
      hashedpassword, 
      usergroupid
    )
    VALUES (
      'owner', 
      'owner', 
      'owner@email.com', 
      $1, 
      (SELECT userGroupId FROM usergroups WHERE userGroupName = 'owner')
    ), (
      'user one', 
      'user1', 
      'user1@email.com', 
      $2, 
      (SELECT userGroupId FROM usergroups WHERE userGroupName = 'user')
    ) 
  `, [hashedPassword, hashedPassword]);

}

async function seedServers(){
  await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  await query(`DROP TABLE IF EXISTS servers`);
  await query(`
    CREATE TABLE IF NOT EXISTS servers (
      serverId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      serverName VARCHAR(32) NOT NULL,
      serverDesc TEXT NOT NULL,
      ownerId UUID NOT NULL,
      isPublic BOOLEAN NOT NULL DEFAULT false,
      isDeleted BOOLEAN NOT NULL DEFAULT false
    )
  `);
  await query(`
    INSERT INTO servers (serverName, serverDesc, ownerId, isPublic, isDeleted)
    VALUES (
      E'owner\\'s server', 
      'The default server that belongs to the owner', 
      (SELECT userId FROM users WHERE userName = 'owner'),
      true,
      false
    )
  `);

}

async function seedCategories(){
  await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  await query(`DROP TABLE IF EXISTS categories`);
  await query(`
    CREATE TABLE IF NOT EXISTS categories (
      categoryId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      categoryName VARCHAR(32) NOT NULL,
      categoryDesc TEXT NOT NULL,
      serverId UUID NOT NULL,
      categorySort INTEGER NOT NULL,
      isPublic BOOLEAN NOT NULL DEFAULT true,
      isDeleted BOOLEAN NOT NULL DEFAULT false
    )
  `);
  await query(`
    INSERT INTO categories (categoryName, categoryDesc, serverId, categorySort, isPublic, isDeleted)
    VALUES (
      'text', 
      'text channels', 
      (SELECT serverId FROM servers WHERE serverName = E'owner\\'s server'),
      1,
      true,
      false
    )
  `);

}

async function seedChannels(){
  await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  await query(`DROP TABLE IF EXISTS channels`);
  await query(`
    CREATE TABLE IF NOT EXISTS channels (
      channelId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      channelName VARCHAR(32) NOT NULL,
      channelDesc TEXT NOT NULL,
      serverId UUID,
      categoryId UUID,
      channelSort INTEGER NOT NULL,
      isPublic BOOLEAN NOT NULL DEFAULT true,
      isDeleted BOOLEAN NOT NULL DEFAULT false,
      isFriendChannel BOOLEAN NOT NULL DEFAULT false 
    )
  `);

  await query(`
    INSERT INTO channels (
      channelName, 
      channelDesc, 
      serverId, 
      categoryId, 
      channelSort, 
      isPublic, 
      isDeleted, 
      isFriendChannel
    )
    VALUES (
      'general', 
      'A channel for general conversation', 
      (SELECT serverId FROM servers WHERE serverName = E'owner\\'s server'),
      (
        SELECT categoryId 
        FROM categories 
        JOIN servers ON servers.serverId = categories.serverId 
        WHERE categoryName = 'text'
        AND serverName = E'owner\\'s server'
      ),
      1,
      true,
      false,
      false
    )
  `);
  await query(`
    INSERT INTO channels (
      channelName, 
      channelDesc, 
      channelSort, 
      isPublic, 
      isDeleted, 
      isFriendChannel
    )
    VALUES (
      'owner user1 friendchannel', 
      'A friend channel for owner and user1', 
      1,
      true,
      false,
      true
    )
  `);
}

async function seedServerUsers(){
  await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  await query(`DROP TABLE IF EXISTS serverusers`);
  await query(`
    CREATE TABLE IF NOT EXISTS serverusers (
      serverUserId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      userId UUID NOT NULL,
      serverId UUID NOT NULL,
      userNickName VARCHAR(32) NOT NULL,
      isBanned BOOLEAN NOT NULL DEFAULT false,
      isUpdated BOOLEAN NOT NULL DEFAULT false
    )
  `);
  await query(`
    INSERT INTO serverusers (
      userId, 
      serverId, 
      userNickName, 
      isBanned,
      isUpdated
    )
    VALUES (
      (SELECT userId FROM users WHERE userName = 'owner'),
      (SELECT serverId FROM servers WHERE serverName = E'owner\\'s server'),
      'owner',
      false,
      false
    ), (
      (SELECT userId FROM users WHERE userName = 'user1'),
      (SELECT serverId FROM servers WHERE serverName = E'owner\\'s server'),
      'user one',
      false,
      false
    )
  `);

}

async function seedChannelUsers(){
  await query(`DROP TABLE IF EXISTS channelusers`);
  await query(`
    CREATE TABLE IF NOT EXISTS channelusers (
      channelUserId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      userId UUID NOT NULL,
      serverId UUID NOT NULL,
      userNickName VARCHAR(32) NOT NULL,
      isBanned BOOLEAN NOT NULL DEFAULT false,
      isUpdated BOOLEAN NOT NULL DEFAULT false
    )
  `);
}

async function seedFriendships(){
  await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  await query(`DROP TABLE IF EXISTS friendships`);
  await query(`
    CREATE TABLE IF NOT EXISTS friendships (
      friendshipId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      firstFriendId UUID NOT NULL,
      secondFriendId UUID NOT NULL,
      sendRequest BOOLEAN NOT NULL DEFAULT false
    )
  `);
  await query(`
    INSERT INTO friendships (
      firstFriendId, 
      secondFriendId, 
      sendRequest 
    )
    VALUES (
      (SELECT userId FROM users WHERE userName = 'owner'),
      (SELECT userId FROM users WHERE userName = 'user1'),
      false
    ), (
      (SELECT userId FROM users WHERE userName = 'user1'),
      (SELECT userId FROM users WHERE userName = 'owner'),
      false
    )
  `);

}

export async function GET() {
  try {
    
    await query(`BEGIN`);
    await seedUserGroups();
    await seedUsers();
    await seedServers();
    await seedCategories();
    await seedChannels();
    await seedServerUsers();
    await seedFriendships();
    await query(`COMMIT`);


    return Response.json({ message: 'Database created successfully' });
  } catch (error) {
    await query(`ROLLBACK`);
    return Response.json({ error }, { status: 500 });
  }
}