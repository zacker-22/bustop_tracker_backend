import {getDatabase} from '../database/database.js';
import axios from 'axios';



const ACT_BASE_URL = 'https://api.actransit.org/transit/';



const updateStops = async () => {
    
    const stopsUrl = `${ACT_BASE_URL}actrealtime/allstops?token=${process.env.ACT_TOKEN}`;
    let stopsResponse = await axios.get(stopsUrl);

    if(stopsResponse.status != 200){
        return false;
    }

    let stops = stopsResponse.data["bustime-response"]["stops"];

    const database = getDatabase();
    // console.log(database);
    const collection = database.collection('stops');

    let promises = [];
    for(let i = 0; i < stops.length; i++){
        promises.push(collection.updateOne({stpid: stops[i].stpid}, {$set: stops[i]}, {upsert: true}));
    }
    
    return Promise.all(promises);
}

export const updateRoutes = async () => {
    const routesUrl = `${ACT_BASE_URL}actrealtime/line?token=${process.env.ACT_TOKEN}`;
    let routesResponse = await axios.get(routesUrl);

    if(routesResponse.status != 200){
        return Promise.resolve();
    }

    let routes = routesResponse.data["bustime-response"]["routes"];

    const database = getDatabase();
    const collection = database.collection('routes');

    let promises = [];
    let routeIds = [];
    let routeDirMap = new Map();

    for(let i = 0; i < routes.length; i++){
        promises.push(collection.updateOne({rt: routes[i].rt}, {$set: routes[i]}, {upsert: true}));
        promises.push(axios.get(`${ACT_BASE_URL}route/${routes[i].rt}/stops?token=${process.env.ACT_TOKEN}`).then((value) => {
            // console.log(value.data[0]);
            let obj = {};
            obj["dir1"] = value.data[0]["Direction"];
            obj["dest1"] = value.data[0]["Destination"];
            obj["stops1"] = value.data[0]["Stops"].map((stop) => stop["StopId"].toString() );
            if(value.data.length > 1){
                obj["dir2"] = value.data[1]["Direction"];
                obj["stops2"] = value.data[1]["Stops"].map((stop) => stop["StopId"].toString() );
                obj["dest2"] = value.data[1]["Destination"];
            }else{
                console.log(routes[i].rt + " has only one direction.");
            }
            collection.updateOne({rt: routes[i].rt}, {$set : {stopdata: obj}}, {upsert: true});
        }));
        
    }
   
    return Promise.all(promises)
}


export const updateDB = async () => {
    const promise1 = updateStops();
    const promise2 = updateRoutes();
    Promise.all([promise1, promise2]).then((values) => {console.log("updated DB");});
}