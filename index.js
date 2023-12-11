import {connectToDatabase, getDatabase} from './database/database.js';
import express from 'express';
import {updateDB} from './cronjobs/updateDB.js';
import {typeDefs, resolvers} from './graphql/definations.js';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';


import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000
const __dirname = process.cwd();
app.use(express.json());

await connectToDatabase();


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

