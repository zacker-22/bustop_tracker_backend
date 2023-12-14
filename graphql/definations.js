import axios from "axios";


const ACT_BASE_URL = 'https://api.actransit.org/transit/';


// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
export const typeDefs = `#graphql
    # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.
    scalar DateTime

    # The "Stop" type defines the queryable fields for every stop in our data source.
    type Stop {
        stpid: ID!,
        stpnm: String,
        geoid: String,
        lat: Float,
        lon: Float,
    }

    # The "StopData" type defines the queryable fields for the stop data of a route in our data source.
    type StopData {
        dir1: String,
        dest1: String,
        stops1: [Stop],
        dir2: String,
        dest2: String,
        stops2: [Stop]
    }

    # The "Route" type defines the queryable fields for every route in our data source.
    type Route {
        rt: ID!,
        rtnm: String,
        rtclr: String,
        rtdd: String,
        dir1: String,
        stops1: [Stop],
        dir2: String,
        stops2: [Stop],
        dest1: String,
        dest2: String,
    }

    type Prd {
        stpnm: String,
        stpid: String,
        rt: String,
        rtdir: String,
        prdtm: DateTime
    }

    # The "Query" type is special: it lists all of the available queries that
    # clients can execute, along with the return type for each. In this
    # case, the "stops" query returns an array of zero or more Stops (defined above).
    type Query {
        stops: [Stop],
        routes: [Route],
        stop(stpid: ID!): Stop,
        route(rt: ID!): Route,
        live(stpids: [String]): [Prd]
    }

    
`;


export const resolvers = {
    Query: {
        stops: async (parent, args, context, info) => {
            const database = context.database;
            const collection = database.collection('stops');
            let stops = await collection.find().toArray();
            stops.sort((a,b) => {
                return a.stpnm.localeCompare(b.stpnm);
            });
            return stops;
        },
        routes: async (parent, args, context, info) => {
            const database = context.database;
            const collection = await database.collection('routes');
            let routes = await collection.find().toArray();
            routes.sort((a,b) => {
                return a.rt.localeCompare(b.rt);
            });
            return routes;
        },
        stop: async (parent, args, context, info) => {
            const database = context.database;
            const collection = await database.collection('stops');
            let stop = await collection.findOne({stpid: args.stpid});
            return stop;
        },
        route: async (parent, args, context, info) => {
            const database = context.database;
            const collection = await database.collection('routes');
            let route = await collection.findOne({rt: args.rt});
            return route;
        },
        live: async (parent, args, context, info) => {

            const res = await axios.get(`${ACT_BASE_URL}actrealtime/prediction?token=${process.env.ACT_TOKEN}&stpid=${args.stpids.join(",")}`);
            if(res.status != 200){
                return [];
            }
            let predictions = res.data["bustime-response"]["prd"];
            return predictions;

        }
       
    },
    Route: {
        dest1: async (parent, args, context, info) => {
            return parent.stopdata.dest1;
        },
        dest2: async (parent, args, context, info) => {
            return parent.stopdata.dest2;
        },
        dir1: async (parent, args, context, info) => {
            return parent.stopdata.dir1;
        },
        dir2: async (parent, args, context, info) => {
            return parent.stopdata.dir2;
        },
        stops1: async (parent, args, context, info) => {
            const database = context.database;
            const collection = await database.collection('stops');
            let stops = await collection.find({stpid: {$in: parent.stopdata.stops1}}).toArray();
            let stopids = parent.stopdata.stops1;
           
            let indexOfStopId = new Map();
            for(let i = 0; i < stopids.length; i++){
                indexOfStopId.set(stopids[i], i);
            }
            stops.sort((a,b) => {
                return indexOfStopId.get(a.stpid) - indexOfStopId.get(b.stpid);
            });
            return stops;
        },
        stops2: async (parent, args, context, info) => {
            const database = context.database;
            const collection = await database.collection('stops');
            let stops = await collection.find({stpid: {$in: parent.stopdata.stops2}}).toArray();
            let stopids = parent.stopdata.stops2;
            
            let indexOfStopId = new Map();
            for(let i = 0; i < stopids.length; i++){
                indexOfStopId.set(stopids[i], i);
            }
            stops.sort((a,b) => {
                return indexOfStopId.get(a.stpid) - indexOfStopId.get(b.stpid);
            });
            return stops;
        }
    }
};
