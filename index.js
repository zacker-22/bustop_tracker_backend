import {connectToDatabase, getDatabase} from './database/database.js';
import express from 'express';
import {updateDB} from './cronjobs/updateDB.js';
import {typeDefs, resolvers} from './graphql/definations.js';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import cron from 'node-cron';
import cors from 'cors';


import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000
const __dirname = process.cwd();
app.use(cors());
app.use(express.json());

await connectToDatabase();

cron.schedule('0 2 * * *', () => {
    console.log(`Updating database at ${new Date() }}`);
    updateDB();
});
// await updateDB();

const server = new ApolloServer({
    typeDefs,
    resolvers
});

const { url } = await startStandaloneServer(server, {
    listen: { port: port },
    context: async ({ req }) => {
        return { database: getDatabase() };
    },
});

console.log(`🚀  Server ready at: ${url}`);

